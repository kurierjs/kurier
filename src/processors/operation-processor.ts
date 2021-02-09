import Resource from "../resource";
import { HasId, Operation, EagerLoadedData } from "../types";
import pick from "../utils/pick";
import promiseHashMap from "../utils/promise-hash-map";
import ApplicationInstance from "../application-instance";
import { JsonApiErrors } from "..";
import { FunctionalOperators as operators, OperatorName } from "../utils/operators";

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

  constructor(public appInstance: ApplicationInstance) { }

  async execute(op: Operation): Promise<ResourceT | ResourceT[] | void> {
    const action: string = op.op;

    if (["update", "remove"].includes(action) && !op.ref.id) {
      throw JsonApiErrors.BadRequest(`${action} is not allowed without a defined primary key`);
    }

    const result = this[action] && (await this[action].call(this, op));
    let eagerLoadedData = {};

    if (result !== undefined) {
      eagerLoadedData = await this.eagerLoad(op, result);
      eagerLoadedData = await this.computeRelationshipProperties(op, eagerLoadedData);
    }

    return this.convertToResources(op, result, eagerLoadedData);
  }

  async computeRelationshipProperties(op, eagerLoadedData) {
    const baseResourceClass = await this.resourceFor(op.ref.type);
    for (const relationship in eagerLoadedData) {
      if (!(relationship in eagerLoadedData)) {
        continue;
      }

      const relationResourceClass =
        baseResourceClass.schema.relationships[relationship] &&
        baseResourceClass.schema.relationships[relationship].type();

      if (!relationResourceClass) {
        continue;
      }

      eagerLoadedData[relationship].direct = await this.computeDirectRelationsProps(
        op,
        eagerLoadedData[relationship].direct,
        relationResourceClass
      );

      eagerLoadedData[relationship].nested = await this.computeNestedRelationsProps(
        op,
        eagerLoadedData[relationship].nested,
        relationResourceClass
      );
    }
    return eagerLoadedData;
  }

  async computeDirectRelationsProps(op: Operation, directRelations, relationResourceClass) {
    const resourceProcessor = await this.processorFor(relationResourceClass.type);

    for (const includedRelationResource in directRelations) {
      if (!(includedRelationResource in directRelations)) {
        continue;
      }
      const value = directRelations[includedRelationResource];
      const computed = await resourceProcessor.getComputedProperties(op, relationResourceClass, value, {});
      directRelations[includedRelationResource] = { ...value, ...computed };
    }
    return directRelations;
  }

  async computeNestedRelationsProps(op: Operation, nestedRelations, baseRelationResourceClass) {
    for (const includedNestedRelation in nestedRelations) {
      if (!(includedNestedRelation in nestedRelations)) {
        continue;
      }
      const includedRelationElements = nestedRelations[includedNestedRelation];
      const nestedRelationResourceClass =
        baseRelationResourceClass.schema.relationships[includedNestedRelation] &&
        baseRelationResourceClass.schema.relationships[includedNestedRelation].type();

      const nestedResourceProcessor = await this.processorFor(nestedRelationResourceClass.type);

      includedRelationElements.map(async (value, index) => {
        const computed = await nestedResourceProcessor.getComputedProperties(
          op,
          nestedRelationResourceClass,
          includedRelationElements,
          {}
        );
        nestedRelations[includedNestedRelation][index] = { ...value, ...computed };
      });
    }
    return nestedRelations;
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
    const typeFields = op.params && op.params.fields && op.params.fields[resourceClass.type];
    const attributes: { [key: string]: Function } = typeFields ? pick(this.attributes, typeFields) : this.attributes;

    return promiseHashMap(attributes, key => attributes[key].call(this, record));
  }

  async matchesComputedFilters(op: Operation, computedAttributes) {
    if (!op.params || !op.params.filter) {
      return true;
    }

    const requestedFilters = Object.keys(op.params.filter);

    if (!requestedFilters.length) {
      return true;
    }

    for (const filterAttribute of requestedFilters) {
      if (filterAttribute in computedAttributes) {
        const filter = op.params.filter[filterAttribute];
        let operator: OperatorName = "eq";
        let expected = filter;
        if (filter.includes(":")) {
          [operator, expected] = filter.split(":") as [OperatorName, string];
        }
        const filterResult = operators[operator](computedAttributes[filterAttribute], expected);
        if (!filterResult) {
          return false;
        }
      }
    }

    return true;
  }

  async getAttributes(op: Operation, resourceClass: typeof Resource, record: HasId, eagerLoadedData: EagerLoadedData) {
    const attributeKeys =
      (op.params && op.params.fields && op.params.fields[resourceClass.type]) ||
      Object.keys(resourceClass.schema.attributes);
    return pick(record, attributeKeys);
  }

  async getRelationships(op: Operation, record: HasId, eagerLoadedData: EagerLoadedData) {
    const include = op.params ? op.params.include : [];
    const relationships: { [key: string]: Function } = pick(this.relationships, include);

    return promiseHashMap(relationships, (key: string) => {
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
      .map(
        relName =>
          resourceClass.schema.relationships[relName].foreignKeyName ||
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

    const resource = new resourceClass({
      relationships,
      id: record[resourceClass.schema.primaryKeyName || "id"],
      attributes: {
        ...attributes,
        ...relationshipAttributes,
        ...computedAttributes
      }
    });

    const passesFilters = await this.matchesComputedFilters(op, computedAttributes);

    if (!passesFilters) {
      resource.preventSerialization = true;
    }

    return resource;
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    return this.appInstance.app.resourceFor(resourceType);
  }

  async processorFor(resourceType: string): Promise<OperationProcessor<Resource>> {
    return this.appInstance.processorFor(resourceType) as Promise<OperationProcessor<Resource>>;
  }

  async get(op: Operation): Promise<HasId[] | HasId> {
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
