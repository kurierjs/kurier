import { ResourceTypeAttributes, ResourceTypeRelationships } from "./types";
import { camelize } from "./utils/string";

export default abstract class Resource {
  public type: string;
  public id?: string;
  public attributes: ResourceTypeAttributes = {};
  public relationships: ResourceTypeRelationships = {};

  constructor({
    id,
    attributes,
  }: {
    id?: string;
    attributes?: ResourceTypeAttributes;
  }) {
    this.type = camelize(this.constructor.name);

    this.id = id;
    this.attributes = attributes || {};

    Object.keys(this.constructor.relationships).forEach(relationshipKey => {
      const relationship = this.constructor.relationships[relationshipKey];

      if (relationship.kind === "belongsTo") {
        this.relationships[relationshipKey] = { data: null };
      } else if (relationship.kind === "hasMany") {
        this.relationships[relationshipKey] = { data: [] };
      }
    });
  }
}
