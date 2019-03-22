import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import { camelize, singularize } from "../utils/string";

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  shouldHandle(op: Operation) {
    return this.resourceClass && op.ref.type === this.resourceClass.type;
  }

  execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  resourceFor(resourceType: string = ""): ResourceConstructor {
    return this.app.types.find(({ type }: { type: string }) => {
      return type === camelize(singularize(resourceType));
    });
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
