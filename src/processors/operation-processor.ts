import Resource from "../resource";
import { HasId, Operation, EagerLoadedData } from "../types";
import pick from "../utils/pick";
import promiseHashMap from "../utils/promise-hash-map";
import ApplicationInstance from "../application-instance";

export default class OperationProcessor<ResourceT extends Resource> {
  static resourceClass: typeof Resource;

  static async shouldHandle(resourceType: string): Promise<boolean> {
    return this.resourceClass && resourceType === this.resourceClass.type;
  }

  get resourceClass(): typeof Resource {
    const staticMember = this.constructor as typeof OperationProcessor;

    return staticMember.resourceClass;
  }

  protected attributes = {};
  protected relationships = {};

  constructor(protected appInstance: ApplicationInstance) {}

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;
    const result = this[action] && (await this[action].call(this, op));
    let eagerLoadedData = {};

    if (result !== undefined) {
      eagerLoadedData = await this.eagerLoad(op, result);
    }

    return this.convertToResources(op, result, eagerLoadedData);
  }

  async eagerLoad(op: Operation, result: ResourceT | ResourceT[]) {
    return {};
  }

  async getComputedProperties(
    op: Operation,
    resourceClass: typeof Resource,
    record: HasId,
    eagerLoadedData: EagerLoadedData
  ) {
    const typeFields = op.params.fields && op.params.fields[resourceClass.type];

    const attributes = typeFields ? pick(this.attributes, typeFields) : this.attributes;

    return promiseHashMap(attributes, key => attributes[key].call(this, record));
  }

  async getAttributes(op: Operation, resourceClass: typeof Resource, record: HasId, eagerLoadedData: EagerLoadedData) {
    const attributeKeys =
      (op.params.fields && op.params.fields[resourceClass.type]) || Object.keys(resourceClass.schema.attributes);
    return pick(record, attributeKeys);
  }

  async getRelationships(op: Operation, record: HasId, eagerLoadedData: EagerLoadedData) {
    const relationships = pick(this.relationships, op.params.include);

    return promiseHashMap(relationships, key => {
      return relationships[key].call(this, record);
    });
  }

  async getRelationshipAttributes(
    op: Operation,
    resourceClass: typeof Resource,
    record: HasId,
    eagerLoadedData: EagerLoadedData
  ) {
    const relationshipKeys = Object.keys(resourceClass.schema.relationships)
      .filter(relName => resourceClass.schema.relationships[relName].belongsTo)
      .map(relName =>
        this.appInstance.app.serializer.relationshipToColumn(
          relName,
          resourceClass.schema.relationships[relName].type().schema.primaryKeyName
        )
      );
    return pick(record, relationshipKeys);
  }

  async convertToResources(op: Operation, records: HasId[] | HasId, eagerLoadedData: EagerLoadedData) {
    if (Array.isArray(records)) {
      return Promise.all(
        records.map(record => {
          return this.convertToResources(op, record, eagerLoadedData);
        })
      );
    }

    const record = { ...records };
    const resourceClass = await this.resourceFor(op.ref.type);
    const [attributes, computedAttributes, relationships, relationshipAttributes] = await Promise.all([
      this.getAttributes(op, resourceClass, record, eagerLoadedData),
      this.getComputedProperties(op, resourceClass, record, eagerLoadedData),
      this.getRelationships(op, record, eagerLoadedData),
      this.getRelationshipAttributes(op, resourceClass, record, eagerLoadedData)
    ]);

    return new resourceClass({
      relationships,
      id: record[resourceClass.schema.primaryKeyName || "id"],
      attributes: {
        ...attributes,
        ...relationshipAttributes,
        ...computedAttributes
      }
    });
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    return this.appInstance.app.resourceFor(resourceType);
  }

  async processorFor(resourceType: string): Promise<OperationProcessor<Resource>> {
    return this.appInstance.processorFor(resourceType);
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
