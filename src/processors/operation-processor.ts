import Application from "../application";
import Resource from "../resource";
import { HasId, Operation, ResourceConstructor } from "../types";

const pick = (object = {}, list = []): {} => {
  return list.reduce((acc, key) => ({ ...acc, [key]: object[key] }), {});
};

const promiseHashMap = async (hash, callback) => {
  const keys = Object.keys(hash);
  const promises = await Promise.all(
    keys.map(async key => {
      return {
        key,
        value: await callback(key)
      };
    })
  );

  return promises.reduce((accum, { key, value }) => {
    return { ...accum, [key]: value };
  }, {});
};

export default class OperationProcessor<ResourceT = Resource> {
  static async shouldHandle(op: Operation): Promise<boolean> {
    return false;
  }

  protected attributes = {};
  protected relationships = {};

  constructor(protected app: Application) {}

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    const result = this[action] && (await this[action].call(this, op));

    return this.convertToResources(op.ref.type, result);
  }

  get computedPropertyNames(): string[] {
    return Object.keys(this.attributes);
  }

  async getComputedProperties(record: HasId) {
    return promiseHashMap(this.attributes, key =>
      this.attributes[key].call(this, record)
    );
  }

  async getRelationships(record: HasId) {
    return promiseHashMap(this.relationships, key =>
      this.relationships[key].call(this, record)
    );
  }

  async convertToResources(type: string, records: HasId[] | HasId) {
    if (Array.isArray(records)) {
      return Promise.all(
        records.map(record => {
          return this.convertToResources(type, record);
        })
      );
    }

    const record = { ...records };
    const resourceClass = await this.resourceFor(type);

    const { id } = record;

    const attributes = pick(
      record,
      Object.keys(resourceClass.schema.attributes)
    );

    const [computedAttributes, relationships] = await Promise.all([
      this.getComputedProperties(record),
      this.getRelationships(record)
    ]);

    return new resourceClass({
      id,
      relationships,
      attributes: {
        ...attributes,
        ...computedAttributes
      }
    });
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
