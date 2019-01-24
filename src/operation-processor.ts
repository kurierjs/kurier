import * as camelize from "camelize";
import * as capitalize from "capitalize";
import * as pluralize from "pluralize";

import Application from "./application";
import Resource from "./resource";
import { Operation, ResourceConstructor } from "./types";

export default abstract class OperationProcessor<ResourceT = Resource> {
  public app: Application;

  execute(op: Operation): Promise<Resource | Resource[] | void> {
    const action: string = op.op;
    return this[op.op](op);
  }

  protected resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === capitalize(pluralize.singular(camelize(type)));
    });
  }

  protected async get?(op: Operation): Promise<Resource[]>;

  protected async remove?(op: Operation): Promise<void>;

  protected async update?(op: Operation): Promise<Resource>;

  protected async add?(op: Operation): Promise<Resource>;
}
