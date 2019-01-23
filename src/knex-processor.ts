import * as Knex from "knex";

import User from "../tests/dummy/src/resources/user/resource";

import OperationProcessor from "./operation-processor";
import Resource from "./resource";
import { ResourceConstructor } from "./types";

export default class KnexProcessor<
  ResourceT extends ResourceConstructor
> extends OperationProcessor<ResourceT> {
  private knex: Knex;

  constructor(public knexOptions = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  private convertToResources(type, records: []) {
    return records.map(record => {
      const id = record["id"];
      delete record["id"];
      const attributes = record;
      const resourceClass: ResourceConstructor = this.resourceFor(type);

      return new resourceClass({ id, attributes });
    });
  }

  async get(type: string, filters = {}): Promise<Resource[]> {
    const tableName = this.typeToTableName(type);

    const records = await this.knex(tableName)
      .where(this.filtersToKnex(filters))
      .select();

    return this.convertToResources(type, records);
  }

  async remove(data: Resource): Promise<null> {
    const tableName = this.typeToTableName(data.type);

    const a = await this.knex(tableName)
      .where({ id: data.id })
      .del();

    return a;
  }

  async update(data: Resource): Promise<Resource> {
    const tableName = this.typeToTableName(data.type);

    return await this.knex(tableName)
      .where({ id: data.id })
      .update(data.attributes);
  }

  async add(data: Resource): Promise<Resource> {
    const tableName = this.typeToTableName(data.type);

    return await this.knex(tableName).insert(data.attributes);
  }

  private typeToTableName(type: string): string {
    return type;
  }

  private filtersToKnex(filters: {}): {} {
    return filters;
  }
}
