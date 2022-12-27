import { Meta, ResourceAttributes, ResourceRelationships, ResourceSchema } from "./types";
import { camelize } from "./utils/string";

export default class Resource {
  static get type(): string {
    return camelize(this.name);
  }

  static schema: ResourceSchema = {
    primaryKeyName: "",
    attributes: {},
    relationships: {},
  };
  id?: string;
  type: string;
  attributes: ResourceAttributes;
  relationships: ResourceRelationships;
  meta?: Meta;

  preventSerialization?: boolean;

  constructor({
    id,
    attributes,
    relationships,
    meta,
  }: {
    id?: string;
    attributes?: ResourceAttributes;
    relationships?: ResourceRelationships;
    meta?: Meta;
  }) {
    this.id = id;
    this.type = (this.constructor as typeof Resource).type;
    this.attributes = attributes || {};
    this.relationships = relationships || {};

    if (meta) {
      this.meta = meta;
    }
  }
}
