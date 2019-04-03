import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";

export default class OperationProcessor<ResourceT = Resource> {
  static resourceClass?: ResourceConstructor;

  static async shouldHandle(op: Operation): Promise<boolean> {
    return this.resourceClass && op.ref.type === this.resourceClass.type;
  }

  constructor(protected app: Application) {}

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  async resourceFor(
    resourceType: string
  ): Promise<ResourceConstructor | undefined> {
    return this.app.resourceFor(resourceType);
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
