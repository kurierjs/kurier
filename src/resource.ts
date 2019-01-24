import * as camelize from "camelize";

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
    this.type = camelize(this.constructor.name.toLowerCase());

    this.id = id;
    this.attributes = attributes || {};
    this.relationships = relationships;
  }
}
