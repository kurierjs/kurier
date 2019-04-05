import Application from "./application";
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";

export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  UnprocessableEntity = 422,
  InternalServerError = 500
}

export type OperationDecorator = (
  operationCallback: Function,
  ...middlewareArguments: any[]
) => (...args: any[]) => any;

// Generic types for JSONAPI document structure.

export type ResourceAttributes = {
  [key: string]: string | number | boolean;
};

export type ResourceRelationships = {
  [key: string]: ResourceRelationship;
};

export type ResourceRelationship = {
  meta?: Meta;
  links: Links;
  data?: ResourceRelationshipData | ResourceRelationshipData[];
};

export type ResourceRelationshipData = {
  type: string;
  id: string;
};

export type Meta = {
  [key: string]: string | number | boolean | Meta;
};

export type JsonApiDocument<
  ResourceT = Resource,
  RelatedResourcesT = Resource
> = {
  data: ResourceT | ResourceT[];
  meta?: Meta;
  included?: RelatedResourcesT[];
};

export type JsonApiErrorsDocument = {
  errors: JsonApiError[];
  meta?: Meta;
};

export type JsonApiError = {
  id?: string;
  status: HttpStatusCode;
  code: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  links?: {
    about?: string;
  };
};

export type JsonApiParams = {
  include?: string[];
  sort?: string[];
  filter?: { [key: string]: string };
  page?: { [key: string]: string[] };
  fields?: { [key: string]: string[] };
};

export type Links = {
  self: string | Link;
  related?: string | Link;
};

export type Link = {
  href: string;
  meta?: Meta;
};

export type Operation = {
  op: string;
  data: Resource;
  included: Resource[];
  ref: {
    type: string;
    id: string | undefined;
    lid: string;
    relationship: string;
  };
  params: JsonApiParams;
  links: Links;
  meta: Meta;
};

export type OperationResponse = {
  data: Resource | Resource[] | null;
};

export type ProcessorConstructor = {
  resourceClass?: ResourceConstructor;
  new (app: Application): OperationProcessor;
  shouldHandle(op: Operation): Promise<boolean>;
};

export type ResourceConstructor<ResourceT = Resource> = {
  type: string;
  schema: ResourceSchema;

  new ({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: ResourceAttributes;
    relationships?: ResourceRelationships;
  }): ResourceT;
};

export type KnexRecord = {
  id: string;
  [key: string]: any;
};

export type AttributeValueMatch = {
  attribute: string;
  value: string | number | boolean | string[] | number[];
};

export type ResourceSchema = {
  attributes: ResourceSchemaAttributes;
  relationships: ResourceSchemaRelationships;
};

export type ResourceSchemaAttributes = {
  [key: string]: StringConstructor | NumberConstructor | BooleanConstructor;
};

export type ResourceSchemaRelationships = {
  [key: string]: ResourceSchemaRelationship;
};

export type ResourceSchemaRelationship = {
  type: () => ResourceConstructor;
  hasMany?: boolean;
  belongsTo?: boolean;
};

export interface HasId {
  id: any;
}
