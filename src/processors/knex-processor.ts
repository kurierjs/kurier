import * as Knex from "knex";
import { Application } from "..";
import JsonApiErrors from "../json-api-errors";
import Resource from "../resource";
import { KnexRecord, Operation, ResourceConstructor, ResourceRelationshipData, ResourceRelationships, ResourceSchemaRelationship } from "../types";
import { camelize, pluralize } from "../utils/string";
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

const buildSortClause = (sort: string[]) =>
  sort.map(criteria => {
    if (criteria.startsWith("-")) {
      return { field: camelize(criteria.substr(1)), direction: "DESC" };
    }

    return { field: camelize(criteria), direction: "ASC" };
  });

const pick = (object = {}, list = []): {} => {
  return list.reduce((acc, key) => ({ ...acc, [key]: object[key] }), {});
};

const getColumns = (
  resourceClass: ResourceConstructor,
  fields = {}
): string[] => {
  const type = resourceClass.type;
  const { attributes, relationships } = resourceClass.schema;

  const relationshipsKeys = Object.entries(relationships)
    .filter(([key, value]) => value.belongsTo)
    .map(([key]) => `${key}Id`);

  let attributesKeys = Object.keys(attributes);

  if (Object.keys(fields).length) {
    attributesKeys = attributesKeys.filter(key =>
      fields[pluralize(type)].includes(key)
    );
  }

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

  async get(op: Operation): Promise<ResourceT[]> {
    const { params, ref } = op;
    const { id, type } = ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return [];

    const tableName = this.typeToTableName(type);
    const filters = params ? { id, ...(params.filter || {}) } : { id };
    const fields = params ? { ...params.fields } : {};

    const records: KnexRecord[] = await this.knex(tableName)
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op))
      .select(getColumns(resourceClass, fields));

    return this.convertToResources(resourceClass, records);
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

  async update(op: Operation): Promise<ResourceT> {
    const { id, type } = op.ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return;

    const tableName = this.typeToTableName(type);

    const updated = await this.knex(tableName)
      .where({ id })
      .first()
      .update(op.data.attributes);

    if (!updated) {
      throw JsonApiErrors.RecordNotExists();
    }

    const record = await this.knex(tableName)
      .where({ id })
      .select(getColumns(resourceClass))
      .first();

    return this.convertToResource(resourceClass, record);
  }

  async add(op: Operation): Promise<ResourceT> {
    const { type } = op.ref;

    const resourceClass = await this.resourceFor(type);
    if (!resourceClass) return;

    const tableName = this.typeToTableName(type);

    const ids = await this.knex(tableName).insert(op.data.attributes, "id");

    const record = await this.knex(tableName)
      .whereIn("id", ids)
      .select(getColumns(resourceClass))
      .first();

    return this.convertToResource(resourceClass, record);
  }

  async convertToResources(
    resourceClass: ResourceConstructor,
    records: KnexRecord[]
  ): Promise<ResourceT[]> {
    return Promise.all(
      records.map(async record => this.convertToResource(resourceClass, record))
    );
  }

  async convertToResource(
    resourceClass: ResourceConstructor,
    record: KnexRecord
  ): Promise<ResourceT> {
    const id = record.id;
    const attributesKeys = Object.keys(resourceClass.schema.attributes);
    const attributes = pick(record, attributesKeys);
    const relationships = this.convertToRelationships(resourceClass, record);

    return (new resourceClass({
      id,
      attributes,
      relationships
    }) as unknown) as ResourceT;
  }

  convertToRelationships(
    resourceClass: ResourceConstructor,
    record: KnexRecord
  ): ResourceRelationships {
    return Object.entries(resourceClass.schema.relationships).reduce(
      (relationships, [key, relationship]) => {
        return {
          ...relationships,
          [key]: {
            data: this.relationshipData(record[`${key}Id`], relationship)
          }
        };
      },
      {}
    );
  }

  relationshipData(
    id: string,
    relationship: ResourceSchemaRelationship
  ): ResourceRelationshipData {
    if (relationship.belongsTo) {
      return id ? { id, type: relationship.type().type } : null;
    }
  }

  typeToTableName(type: string): string {
    return camelize(pluralize(type));
  }

  filtersToKnex(queryBuilder, filters: {}) {
    Object.keys(filters).forEach(key => {
      let value = filters[key];

      if (value === undefined) {
        return;
      }

      const filterKey = camelize(key);

      if (Array.isArray(value)) {
        queryBuilder.whereIn(filterKey, value);
      } else {
        value = String(value);
        const operator = getOperator(value) || "=";

      if (value.substring(value.indexOf(":") + 1)) {
        value = value.substring(value.indexOf(":") + 1);
      }

        queryBuilder[getWhereMethod(value, operator)](
          filterKey,
          operator,
          value
        );
      }
    });
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
}
