import Application from "../application";
import Resource from "../resource";
import { Operation, ResourceConstructor } from "../types";
import { classify, singularize, pluralize } from "../utils/string";

export interface HasId {
  id: any;
}

const promiseHashMap = async (hash, callback) => {
  const keys = Object.keys(hash);
  const promises = await Promise.all(keys.map(async (key) => {
    return {
      key,
      value: await callback(key)
    };
  }));

  return promises.reduce((accum, {key, value}) => {
    return {...accum, [key]: value}
  }, {});
};

export default class OperationProcessor<ResourceT = Resource> {
  public app: Application;
  public resourceClass?: ResourceConstructor;

  shouldHandle(op: Operation) {
    return this.resourceClass && op.ref.type === this.resourceClass.name;
  }

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    let result = this[action] && await this[action].call(this, op);

    return this.convertToResources(op.ref.type, result);
  }

  getAttributes(attributes, fields, type): string[] {
    if (Object.entries(fields).length === 0 && fields.constructor === Object) {
      return attributes;
    }

    return attributes.filter(attribute =>
      fields[pluralize(type)].includes(attribute)
    );
  }

  get computedPropertyNames() : string[] {
    return Object.keys(this.attributes);
  }

  async getComputedProperties(record: HasId) {
    return promiseHashMap(this.attributes, (key) => this.attributes[key].call(this, record));
  }
  async getRelationships(record: HasId) {
    return promiseHashMap(this.relationships, (key) => this.relationships[key].call(this, record));
  }

  async convertToResources(type: string, records: HasId[] | HasId) {
    if (Array.isArray(records)) {
      return Promise.all(records.map(record => {
        return this.convertToResources(type, record);
      }));
    }

    const record = {...records};
    const id = record.id;
    const [computedAttributes, relationships] = await Promise.all([
      this.getComputedProperties(record),
      this.getRelationships(record)
    ]);

    delete record.id;
    const attributes = record;
    const resourceClass: ResourceConstructor<ResourceT> = (this.resourceFor(
      type
    ) as unknown) as ResourceConstructor<ResourceT>;

    return new resourceClass({
      id,
      attributes: {
        ...attributes, ...computedAttributes
      },
      relationships
    });
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.app.types.find(({ name }: { name: string }) => {
      return name === classify(singularize(type));
    });
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

  attributes = {}

  relationships = {}
}
