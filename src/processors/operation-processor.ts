import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import { classify, singularize } from "../utils/string";

interface HasId {
  id: any;
}

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  shouldHandle(op: Operation) {
    return this.resourceClass && op.ref.type === this.resourceClass.name;
  }

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    let result = await this[action] && this[action].call(this, op);

    return this.convertToResources(op.ref.type, result);
  }

  convertToResources(type: string, records: HasId[] | HasId) {
    if (Array.isArray(records)) {
      return records.map(record => {
        return this.convertToResources(type, record);
      });
    }

    const record = {...records};
    const id = record.id;
    delete record.id;
    const attributes = record;
    const resourceClass: ResourceConstructor<ResourceT> = (this.resourceFor(
      type
    ) as unknown) as ResourceConstructor<ResourceT>;

    return new resourceClass({ id, attributes });
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === classify(singularize(type));
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
