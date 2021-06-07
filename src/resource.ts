import { ResourceAttributes, ResourceRelationships, ResourceSchema, DefaultLinks, Meta } from "./types";
import { camelize } from "./utils/string";

interface IResourceConstructorProps {
  id?: string;
  attributes?: ResourceAttributes;
  relationships?: ResourceRelationships;
  meta?: Meta;
};

export default class Resource {
  static get type() {
    return camelize(this.name);
  }

  static schema: ResourceSchema = {
    primaryKeyName: "",
    attributes: {},
    relationships: {}
  };

  id?: string;
  type: string;
  attributes: ResourceAttributes;
  relationships?: ResourceRelationships;
  meta?: Meta;
  links?: DefaultLinks;

  preventSerialization?: boolean;

  constructor({
    id,
    attributes,
    relationships,
    meta,
  }: IResourceConstructorProps) {
    this.id = id;
    this.type = (this.constructor as typeof Resource).type;
    this.attributes = attributes || {};
    this.relationships = relationships || {};
    this.meta = meta;
  }
}
