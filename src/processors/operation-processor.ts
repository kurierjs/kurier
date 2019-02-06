import * as camelize from "camelize";
import * as capitalize from "capitalize";
import * as dasherize from "dasherize";
import * as pluralize from "pluralize";

import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  shouldHandle(op: Operation) {
    return (
      this.resourceClass &&
      op.ref.type === camelize(dasherize(this.resourceClass.name))
    );
  }

  execute(op: Operation): Promise<Resource | Resource[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === capitalize(pluralize.singular(camelize(type)));
    });
  }

  protected async get(op: Operation): Promise<Resource[]> {
    return [];
  }

  protected async remove(op: Operation): Promise<void> {
    return Promise.reject();
  }

  protected async update(op: Operation): Promise<Resource> {
    return Promise.reject();
  }

  protected async add(op: Operation): Promise<Resource> {
    return Promise.reject();
  }
}
