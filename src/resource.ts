import { ResourceTypeAttributes, ResourceTypeRelationships } from "./types";
import { camelize } from "./utils/string";

export default abstract class Resource {
  id?: string;
  type: string;
  attributes: ResourceTypeAttributes;
  relationships: ResourceTypeRelationships;

  static attributes: ResourceTypeAttributes = {};
  static relationships: ResourceTypeRelationships = {};

  static get type() {
    return camelize(this.name);
  }

  constructor({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: ResourceTypeAttributes;
    relationships?: ResourceTypeRelationships;
  }) {
    this.id = id;
    this.type = (this.constructor as typeof Resource).type;
    this.attributes = attributes || {};
    this.relationships = relationships || {};
  }
}
