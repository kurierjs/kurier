import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import { classify, singularize } from "../utils/string";

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  shouldHandle(type: string) {
    return this.resourceClass && type === this.resourceClass.name;
  }

  execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.resourceFor(type);
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
