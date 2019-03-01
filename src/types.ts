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

export type ResourceTypeAttributes = {
  [key: string]: string | number | boolean;
};

export type ResourceTypeRelationships = {
  [key: string]: ResourceRelationships;
};

export type ResourceRelationships = {
  data: ResourceRelationship | ResourceRelationship[];
};

export type ResourceRelationship = {
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

export type Links = {};

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

export type ResourceConstructor<ResourceT = Resource> = {
  new ({
    id,
    attributes,
    relationships
  }: {
    id?: string;
    attributes?: {};
    relationships?: ResourceTypeRelationships;
  }): ResourceT;
};

export type KnexRecord = {
  id: string;
  [key: string]: any;
};
