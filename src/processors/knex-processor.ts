import * as Knex from "knex";

import Resource from "../resource";
import { KnexRecord, Operation, ResourceConstructor } from "../types";
import { camelize, pluralize } from "../utils/string";

import OperationProcessor, { HasId } from "./operation-processor";

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

const buildSortClause = sort =>
  sort.split(",").map(criteria => {
    if (criteria.startsWith("-")) {
      return { field: camelize(criteria.substr(1)), direction: "DESC" };
    }

    return { field: camelize(criteria), direction: "ASC" };
  });


export default class KnexProcessor<
  ResourceT = Resource
> extends OperationProcessor<ResourceT> {
  protected knex: Knex;

  constructor(public knexOptions: Knex.Config = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  getColumns(attributes, fields, type): string[] {

    return this.getAttributes(attributes, fields, type)
      .filter(attribute => !this.computedPropertyNames.includes(attribute));
  }

  async get(op: Operation): Promise<HasId[]> {
    const { params, ref } = op;
    const { id, type } = ref;
    const tableName = this.typeToTableName(type);
    const filters = params ? { id, ...(params.filter || {}) } : { id };
    const resource = Object.create(this.resourceFor(type));
    const fields = params ? { ...params.fields } : {};
    const attributes = this.getColumns(
      Object.keys(resource.__proto__.attributes),
      fields,
      type
    );

    const records: KnexRecord[] = await this.knex(tableName)
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .select(...attributes, "id")
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op));

    return records;
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<HasId> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);

    await this.knex(tableName)
      .where({ id })
      .update(op.data.attributes);

    const records: HasId[] = await this.knex(tableName)
      .where({ id })
      .select();

    return records[0];
  }

  async add(op: Operation): Promise<HasId> {
    const { type } = op.ref;
    const tableName = this.typeToTableName(type);

    const [id] = await this.knex(tableName).insert(op.data.attributes);
    const records: HasId[] = await this.knex(tableName)
      .where({ id })
      .select();

    return records[0];
  }

  typeToTableName(type: string): string {
    return pluralize(type);
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

      value = value !== "null" ? value : 0;

      processedFilters.push({
        value,
        operator,
        column: camelize(key)
      });
    });

    return processedFilters.forEach(filter => {
      return queryBuilder.andWhere(
        filter.column,
        filter.operator,
        filter.value
      );
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
