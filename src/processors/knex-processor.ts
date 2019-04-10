import * as Knex from "knex";
import { Application } from "..";
import JsonApiErrors from "../json-api-errors";
import Resource from "../resource";
import {
  HasId,
  KnexRecord,
  Operation,
  ResourceSchemaRelationship
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
    .map(([key]) => `${key}Id`);

  const typeFields = (fields[type] || []).filter(key =>
    Object.keys(attributes).includes(key)
  );

  const attributesKeys = typeFields.length
    ? typeFields
    : Object.keys(attributes);

  return [...attributesKeys, ...relationshipsKeys, "id"];
};

export default class KnexProcessor<
  ResourceT = Resource
> extends OperationProcessor<ResourceT> {
  protected knex: Knex;

  constructor(app: Application) {
    super(app);
    this.knex = app.services.knex;
  }

  getQuery(): Knex.QueryBuilder {
    return this.knex(this.typeToTableName(this.resourceClass.type));
  }

  async eagerLoad(op: Operation, result: any) {
    const relationships = pick(
      this.resourceClass.schema.relationships,
      op.params.include
    );

    return promiseHashMap(relationships, key => {
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

  async getRelationships(op: Operation, record: HasId, eagerLoadedData: any) {
    const relationships = pick(
      this.resourceClass.schema.relationships,
      op.params.include
    );

    return promiseHashMap(relationships, key => {
      if (relationships[key] instanceof Function) {
        return relationships[key].call(this, record);
      }

      const relationshipSchema = this.resourceClass.schema.relationships[key];

      return this.fetchRelationship(key, relationshipSchema, record, eagerLoadedData);
    });
  }

  async eagerFetchRelationship(relationship: ResourceSchemaRelationship, result: any) {
    const relationProcessor: KnexProcessor = await this.processorFor(relationship.type().type) as KnexProcessor;
    const query = relationProcessor.getQuery();
    const foreignTableName = relationProcessor.tableName;

    if (relationship.belongsTo) {
      const foreignKey = relationship.foreignKeyName || `${relationship.type().type}Id`;
      return query
        .join(this.tableName, `${foreignTableName}.id`, '=', `${this.tableName}.${foreignKey}`)
        .select(`${foreignTableName}.*`);
    }

    return null;
  }

  async fetchRelationship(
    key: string,
    relationship: ResourceSchemaRelationship,
    record: HasId,
    eagerLoadedData
  ) {
    const relationProcessor: KnexProcessor = await this.processorFor(relationship.type().type) as KnexProcessor;
    const query = relationProcessor.getQuery();
    const foreignTableName = relationProcessor.tableName;

    if (relationship.belongsTo) {
      const foreignKey = relationship.foreignKeyName || `${relationship.type().type}Id`;

      return eagerLoadedData[key].find(a => a.id === record[foreignKey]);
    }

    if (relationship.hasMany) {
      const foreignKey = relationship.foreignKeyName || `${this.resourceClass.type}Id`;
      return query
        .where(
          foreignKey,
          record.id
        )
        .select();
    }
  }
}
