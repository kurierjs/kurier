import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import { classify, singularize } from "../utils/string";

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  protected includedResources: Resource[] = [];

  shouldHandle(op: Operation) {
    return this.resourceClass && op.ref.type === this.resourceClass.name;
  }

  execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    return this[action] && this[action].call(this, op);
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === classify(singularize(type));
    });
  }

  include(resources: Resource[]) {
    resources.forEach(resource => {
      if (
        !this.includedResources.find(included => included.id === resource.id)
      ) {
        this.includedResources.push(resource);
      }
    });
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
