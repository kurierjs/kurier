import { ResourceTypeRelationships } from "./types";

export default abstract class Resource {
  public type: string;
  public id?: string;
  public attributes?: {};
  public relationships?: ResourceTypeRelationships;

  constructor({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: {};
    relationships?: ResourceTypeRelationships;
  }) {
    this.type = this.constructor.name;

    this.id = id;
    this.attributes = attributes || {};
    this.relationships = relationships;
  }
}
