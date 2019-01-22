import * as Knex from "knex";
import Router, { RouterContext } from "koa-router";

import OperationProcessor from "./operation-processor";
import { Resource } from "./types";

export default class KnexProcessor<
  ResourceT extends Resource
> extends OperationProcessor<ResourceT> {
  private knex: any;
  private tableName: string;

  constructor(
    httpRouter: Router,
    public resourceName: string,
    public knexOptions = {}
  ) {
    super(httpRouter, resourceName);

    this.knex = Knex(knexOptions);
    this.tableName = this.typeToTableName(resourceName);
  }

  async get(filters = {}, ctx: RouterContext) {
    return await this.knex(this.tableName)
      .where(this.filtersToKnex(filters))
      .select();
  }

  async remove(filters = {}, ctx: RouterContext) {
    return await this.knex(this.tableName)
      .where(this.filtersToKnex(filters))
      .del();
  }

  async update(filters = {}, data: ResourceT, ctx: RouterContext) {
    return await this.knex(this.tableName)
      .where(this.filtersToKnex(filters))
      .update(data.attributes);
  }

  async add(data: ResourceT, ctx: RouterContext) {
    return await this.knex(this.tableName).insert(data.attributes);
  }

  private typeToTableName(type: string): string {
    return type;
  }

  private filtersToKnex(filters: {}): {} {
    return filters;
  }
}
