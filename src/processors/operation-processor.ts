import * as camelize from "camelize";
import * as dasherize from "dasherize";
import * as pluralize from "pluralize";

import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import capitalize from "../utils/capitalize";

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  protected includedResources: Resource[] = [];

  shouldHandle(op: Operation) {
    return (
      this.resourceClass &&
      op.ref.type === camelize(dasherize(this.resourceClass.name))
    );
  }

  execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === capitalize(pluralize.singular(camelize(type)));
    });
  }

  include(resources: Resource[]) {
    this.includedResources = [...this.includedResources, ...resources];
  }

  flushIncludes() {
    const included = [...this.includedResources];
    this.includedResources = [];
    return included;
  }

  async get(op: Operation): Promise<ResourceT[]> {
    return [];
  }

  async remove(op: Operation): Promise<void> {
    return Promise.reject();
  }

  async update(op: Operation): Promise<ResourceT> {
    return Promise.reject();
  }

  async add(op: Operation): Promise<ResourceT> {
    return Promise.reject();
  }
}
