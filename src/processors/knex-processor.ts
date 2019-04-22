import * as Knex from "knex";
import { Application } from "..";
import JsonApiErrors from "../json-api-errors";
import Resource from "../resource";
import {
  HasId,
  KnexRecord,
  Operation,
  ResourceSchemaRelationship,
  EagerLoadedData
} from "../types";
import { camelize, pluralize } from "../utils/string";
import pick from "../utils/pick";
import promiseHashMap from "../utils/promise-hash-map";
import OperationProcessor from "./operation-processor";

const operators = {
  eq: "=",
  ne: "!=",
  lt: "<",
  gt: ">",
  le: "<=",
  ge: ">=",
  like: "like",
  in: "in",
  nin: "not in"
};

const getOperator = (paramValue: string): string =>
  operators[
  Object.keys(operators).find(
    operator => paramValue.indexOf(`${operator}:`) === 0
  )
  ];

const getWhereMethod = (value: string, operator: string) => {
  if (value !== "null") {
    return "andWhere";
  }

  if (value === "null" && operator === "=") {
    return "whereNull";
  }

  if (value === "null" && operator === "!=") {
    return "whereNotNull";
  }
};

const buildSortClause = (sort: string[]) => {
  return sort.map(criteria => {
    if (criteria.startsWith("-")) {
      return { field: camelize(criteria.substr(1)), direction: "DESC" };
    }

    return { field: camelize(criteria), direction: "ASC" };
  });
};

const getColumns = (resourceClass: typeof Resource, fields = {}): string[] => {
  const type = resourceClass.type;
  const { attributes, relationships } = resourceClass.schema;

  const relationshipsKeys = Object.entries(relationships)
    .filter(([key, value]) => value.belongsTo)
    .map(([key, value]) => value.foreignKeyName || `${key}Id`);
  const typeFields = (fields[type] || []).filter((key: string) =>
    Object.keys(attributes).includes(key)
  );

  const attributesKeys = typeFields.length
    ? typeFields
    : Object.keys(attributes);

  return [...attributesKeys, ...relationshipsKeys, "id"];
};

export default class KnexProcessor<
  ResourceT extends Resource
  > extends OperationProcessor<ResourceT> {
  protected knex: Knex;

  constructor(app: Application) {
    super(app);
    this.knex = app.services.knex;
  }

  getQuery(): Knex.QueryBuilder {
    return this.knex(this.typeToTableName(this.resourceClass.type));
  }

  async eagerLoad(op: Operation, result: ResourceT | ResourceT[]) {
    const relationships = pick(
      this.resourceClass.schema.relationships,
      op.params.include
    );

    return promiseHashMap(relationships, (key: string) => {
      const relationshipSchema = this.resourceClass.schema.relationships[key];

      return this.eagerFetchRelationship(relationshipSchema, result);
    });
  }

  async get(op: Operation): Promise<HasId[]> {
    const { params, ref } = op;
    const { id, type } = ref;

    const filters = params ? { id, ...(params.filter || {}) } : { id };

    const records: KnexRecord[] = await this.getQuery()
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op))
      .select(getColumns(this.resourceClass, op.params.fields));

    return records;
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    const record = await this.getQuery()
      .where({ id: op.ref.id })
      .first();

    if (!record) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.getQuery()
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { id, type } = op.ref;

    const updated = await this.getQuery()
      .where({ id })
      .first()
      .update(op.data.attributes);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.getQuery()
      .where({ id })
      .select(getColumns(this.resourceClass))
      .first();
  }

  async add(op: Operation): Promise<HasId> {
    const { type } = op.ref;

    const ids = await this.getQuery().insert(op.data.attributes, "id");

    return await this.getQuery()
      .whereIn("id", ids)
      .select(getColumns(this.resourceClass))
      .first();
  }

  typeToTableName(type: string): string {
    return camelize(pluralize(type));
  }

  get tableName() {
    return this.typeToTableName(this.resourceClass.type);
  }

  filtersToKnex(queryBuilder, filters: {}) {
    const processedFilters = [];

    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key]
    );

    Object.keys(filters).forEach(key => {
      let value = filters[key];
      const operator = getOperator(filters[key]) || "=";

      if (value.substring(value.indexOf(":") + 1)) {
        value = value.substring(value.indexOf(":") + 1);
      }

      processedFilters.push({
        value,
        operator,
        method: getWhereMethod(value, operator),
        column: camelize(key)
      });
    });

    return processedFilters.forEach(filter =>
      queryBuilder[filter.method](filter.column, filter.operator, filter.value)
    );
  }

  optionsBuilder(queryBuilder, op) {
    const { sort, page } = op.params;
    if (sort) {
      buildSortClause(sort).forEach(({ field, direction }) => {
        queryBuilder.orderBy(field, direction);
      });
    }

    if (page) {
      queryBuilder.offset(page.offset).limit(page.limit);
    }
  }

  async getRelationships(
    op: Operation,
    record: HasId,
    eagerLoadedData: EagerLoadedData
  ) {
    const relationships = pick(
      this.resourceClass.schema.relationships,
      op.params.include
    );

    return promiseHashMap(relationships, (key: string) => {
      if (relationships[key] instanceof Function) {
        return relationships[key].call(this, record);
      }

      const relationshipSchema = this.resourceClass.schema.relationships[key];

      return this.fetchRelationship(
        key,
        relationshipSchema,
        record,
        eagerLoadedData
      );
    });
  }

  async eagerFetchRelationship(
    relationship: ResourceSchemaRelationship,
    result: ResourceT | ResourceT[]
  ): Promise<KnexRecord[] | void> {
    const relationProcessor: KnexProcessor<Resource> = (await this.processorFor(
      relationship.type().type
    )) as KnexProcessor<Resource>;
    const query = relationProcessor.getQuery();
    const foreignTableName = relationProcessor.tableName;
    const sqlOperator = Array.isArray(result) ? "in" : "=";
    const queryIn: string | string[] = Array.isArray(result) ? result.map((a: Resource) => a.id) : result.id;

    if (relationship.belongsTo) {
      const foreignKey =
        relationship.foreignKeyName || `${relationship.type().type}Id`;
      return query
        .join(
          this.tableName,
          `base${foreignTableName}.id`,
          "=",
          `${this.tableName}.${foreignKey}`
        )
        .where(`${this.tableName}.id`, sqlOperator, queryIn)
        .select(`base${foreignTableName}.*`).from(`${foreignTableName} as base${foreignTableName}`);
    }

    if (relationship.hasMany) {
      const foreignKey =
        relationship.foreignKeyName || `${relationship.type().type}Id`;
      return query
        .join(
          this.tableName,
          `${foreignTableName}.${foreignKey}`,
          "=",
          `${this.tableName}.id`
        )
        .where(`${this.tableName}.id`, sqlOperator, queryIn)
        .select(`${foreignTableName}.*`);
    }
  }

  async fetchRelationship(
    key: string,
    relationship: ResourceSchemaRelationship,
    record: HasId,
    eagerLoadedData: EagerLoadedData
  ): Promise<KnexRecord | KnexRecord[] | void> {
    const relationProcessor: KnexProcessor<Resource> = (await this.processorFor(
      relationship.type().type
    )) as KnexProcessor<Resource>;
    const query = relationProcessor.getQuery();

    if (relationship.belongsTo) {
      const foreignKey =
        relationship.foreignKeyName || `${relationship.type().type}Id`;

      if (!eagerLoadedData[key]) {
        return;
      }

      return eagerLoadedData[key].find(
        (eagerLoadedRecord: KnexRecord) =>
          eagerLoadedRecord.id === record[foreignKey]
      );
    }

    if (relationship.hasMany) {
      const foreignKey =
        relationship.foreignKeyName || `${relationship.type().type}Id`;

      if (!eagerLoadedData[key]) {
        return;
      }

      return eagerLoadedData[key].filter(
        (eagerLoadedRecord: KnexRecord) =>
          record.id === eagerLoadedRecord[foreignKey]
      );
    }
  }
}
