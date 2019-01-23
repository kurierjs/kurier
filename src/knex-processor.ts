import * as Knex from "knex";

import Application from "./application";
import OperationProcessor from "./operation-processor";
import { Resource } from "./types";

export default class KnexProcessor<
  ResourceT extends Resource
> extends OperationProcessor<ResourceT> {
  private knex: any;

  constructor(public knexOptions = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  async get(type: string, filters = {}): Promise<Resource[]> {
    const tableName = this.typeToTableName(type);

    return await this.knex(tableName)
      .where(this.filtersToKnex(filters))
      .select();
  }

  async remove(data: Resource): Promise<boolean> {
    const tableName = this.typeToTableName(data.type);

    return await this.knex(tableName)
      .where({ id: data.id })
      .del();
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
