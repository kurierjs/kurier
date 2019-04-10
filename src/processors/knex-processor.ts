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

  async get(op: Operation): Promise<HasId[]> {
    const { params, ref } = op;
    const { id, type } = ref;

    const tableName = this.typeToTableName(type);
    const filters = params ? { id, ...(params.filter || {}) } : { id };

    const records: KnexRecord[] = await this.knex(tableName)
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op))
      .select(getColumns(this.resourceClass, op.params.fields));

    return records;
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    const record = await this.knex(tableName)
      .where({ id: op.ref.id })
      .first();

    if (!record) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { id, type } = op.ref;

    const tableName = this.typeToTableName(type);

    const updated = await this.knex(tableName)
      .where({ id })
      .first()
      .update(op.data.attributes);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    return await this.knex(tableName)
      .where({ id })
      .select(getColumns(this.resourceClass))
      .first();
  }

  async add(op: Operation): Promise<HasId> {
    const { type } = op.ref;

    const tableName = this.typeToTableName(type);

    const ids = await this.knex(tableName).insert(op.data.attributes, "id");

    return await this.knex(tableName)
      .whereIn("id", ids)
      .select(getColumns(this.resourceClass))
      .first();
  }

  typeToTableName(type: string): string {
    return camelize(pluralize(type));
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

  async getRelationships(op: Operation, record: HasId) {
    const relationships = pick(
      this.resourceClass.schema.relationships,
      op.params.include
    );

    return promiseHashMap(relationships, key => {
      if (relationships[key] instanceof Function) {
        return relationships[key].call(this, record);
      }

      const relationshipSchema = this.resourceClass.schema.relationships[key];

      return this.fetchRelationship(relationshipSchema, record);
    });
  }

  async fetchRelationship(
    relationship: ResourceSchemaRelationship,
    record: HasId
  ) {
    if (relationship.belongsTo) {
      const sourceTable = this.typeToTableName(
        relationship.foreignKeyName || relationship.type().type
      );
      return this.knex(sourceTable)
        .where("id", record.id)
        .first();
    }

    if (relationship.hasMany) {
      const sourceTable = this.typeToTableName(relationship.type().type);
      return this.knex(sourceTable)
        .where(
          `${relationship.foreignKeyName || this.resourceClass.type}Id`,
          record.id
        )
        .select();
    }
  }
}
