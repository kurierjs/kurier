import * as camelize from "camelize";
import * as capitalize from "capitalize";
import * as pluralize from "pluralize";

import Application from "./application";
import Resource from "./resource";
import { Operation, ResourceConstructor } from "./types";

export default abstract class OperationProcessor<ResourceT = Resource> {
  public app: Application;

  execute(op: Operation) {
    const action: string = op.op;

    if (action === "get") {
      return this.get(
        op.ref.type,
        op.ref.id ? { id: op.ref.id } : (op.params && op.params.filter) || {}
      );
    }

    if (action === "remove") {
      return this.remove(op.data);
    }

    if (action === "update") {
      return this.update(op.data);
    }

    if (action === "add") {
      return this.add(op.data);
    }
  }

  protected resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === capitalize(pluralize.singular(camelize(type)));
    });
  }

  protected async get?(type: string, filters: {}): Promise<Resource[]>;

  protected async remove?(data: Resource): Promise<null>;

  protected async update?(data: Resource): Promise<Resource>;

  protected async add?(data: Resource): Promise<Resource>;
}
