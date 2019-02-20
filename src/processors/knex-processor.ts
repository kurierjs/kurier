import * as Knex from "knex";
import * as pluralize from "pluralize";

import Resource from "../resource";
import { KnexRecord, Operation, ResourceConstructor } from "../types";

import OperationProcessor from "./operation-processor";

const operators = {
  eq: '=',
  ne: '!=',
  lt: '<',
  gt: '>',
  le: '<=',
  ge: '>=',
  like: 'like',
  in: 'in',
};

const getOperator = (paramValue: any) =>
  operators[Object.keys(operators).find(operator => paramValue.indexOf(`${operator}:`) === 0)];

export default class KnexProcessor<
  ResourceT = Resource
> extends OperationProcessor<ResourceT> {
  private knex: Knex;

  constructor(public knexOptions: Knex.Config = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  async get(op: Operation): Promise<ResourceT[]> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);
    const filters = op.params ? { id, ...(op.params.filter || {}) } : { id };

    const records: KnexRecord[] = await this.knex(tableName)
      .where(builder => this.filtersToKnex(builder, filters))
      .select();

    return this.convertToResources(type, records);
  }

  async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  async update(op: Operation): Promise<ResourceT> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);

    await this.knex(tableName)
      .where({ id })
      .update(op.data.attributes);

    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(type, records)[0];
  }

  async add(op: Operation): Promise<ResourceT> {
    const { type } = op.ref;
    const tableName = this.typeToTableName(type);

    const [id] = await this.knex(tableName).insert(op.data.attributes);
    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(type, records)[0];
  }

  convertToResources(type: string, records: KnexRecord[]) {
    return records.map(record => {
      const id = record.id;
      delete record.id;
      const attributes = record;
      const resourceClass: ResourceConstructor<ResourceT> = (this.resourceFor(
        type
      ) as unknown) as ResourceConstructor<ResourceT>;

      return new resourceClass({ id, attributes });
    });
  }

  typeToTableName(type: string): string {
    return pluralize(type);
  }

  filtersToKnex(builder, filters: {}) {
    const processedFilters = [];

    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key],
    );

    Object.keys(filters).forEach((key) => {

      let value = filters[key];
      if (value.substring(value.indexOf(':') + 1)) {
        value = value.substring(value.indexOf(':') + 1)
        value = value ? value : 0;
      }

      let operator = getOperator(filters[key]);
      operator = operator ? operator : '=';

      processedFilters.push({
        value,
        operator,
        column: key,
      });
    });

    return processedFilters.forEach((filter) => {
      return builder.andWhere(filter.column, filter.operator, filter.value);
    });
  }
}
