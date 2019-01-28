import * as Knex from "knex";
import * as pluralize from "pluralize";

import OperationProcessor from "./operation-processor";
import Resource from "./resource";
import { KnexRecord, Operation, ResourceConstructor } from "./types";

export default class KnexProcessor<
  ResourceT extends ResourceConstructor
> extends OperationProcessor<ResourceT> {
  private knex: Knex;

  constructor(public knexOptions: Knex.Config = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  private convertToResources(type: string, records: KnexRecord[]) {
    return records.map(record => {
      const id = record["id"];
      delete record["id"];
      const attributes = record;
      const resourceClass: ResourceConstructor = this.resourceFor(type);

      return new resourceClass({ id, attributes });
    });
  }

  async get(op: Operation): Promise<Resource[]> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);
    const filters = op.params ? { id, ...(op.params.filter || {}) } : { id };

    const records: KnexRecord[] = await this.knex(tableName)
      .where(this.filtersToKnex(filters))
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

  async update(op: Operation): Promise<Resource> {
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

  async add(op: Operation): Promise<Resource> {
    const { type } = op.ref;
    const tableName = this.typeToTableName(type);

    const [id] = await this.knex(tableName).insert(op.data.attributes);
    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(type, records)[0];
  }

  private typeToTableName(type: string): string {
    return pluralize(type);
  }

  private filtersToKnex(filters: {}): {} {
    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key]
    );

    return filters;
  }
}
