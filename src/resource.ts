import { ResourceTypeAttributes, ResourceTypeRelationships } from "./types";
import { camelize } from "./utils/string";

export default abstract class Resource {
  public type: string;
  public id?: string;
  public attributes: ResourceTypeAttributes;
  public relationships: ResourceTypeRelationships;

  constructor({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: ResourceTypeAttributes;
    relationships?: ResourceTypeRelationships;
  }) {
    this.type = camelize(this.constructor.name);

    this.id = id;
    this.attributes = attributes || {};
    this.relationships = relationships || {};
  }
}
