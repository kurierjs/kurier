import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";

export interface HasId {
  id: any;
}

export default class OperationProcessor<ResourceT = Resource> {
  static resourceClass?: ResourceConstructor;

  static async shouldHandle(op: Operation): Promise<boolean> {
    return this.resourceClass && op.ref.type === this.resourceClass.type;
  }

  constructor(protected app: Application) {}

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

  async resourceFor(
    resourceType: string
  ): Promise<ResourceConstructor | undefined> {
    return this.app.resourceFor(resourceType);
  }

  async get(op: Operation): Promise<HasId[]> {
    return [];
  }

  async remove(op: Operation): Promise<void> {
    return Promise.reject();
  }

  async update(op: Operation): Promise<HasId> {
    return Promise.reject();
  }

  async add(op: Operation): Promise<HasId> {
    return Promise.reject();
  }
}
