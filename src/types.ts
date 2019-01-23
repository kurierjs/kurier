import { RouterContext } from "koa-router";

import OperationProcessor from "./operation-processor";
import Resource from "./resource";

export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  InternalServerError = 500
}

export enum ResourceOperations {
  Get,
  Add
}

export type AuthenticatedRequest = {
  headers: {
    authorization: string;
  };
};

export type AuthenticatedContext = RouterContext & { user?: Resource };

export type OperationDecorator = (
  operationProcessor: OperationProcessor,
  operationCallback: Function,
  ...middlewareArguments: any[]
) => (...args: any[]) => any;

export type Middleware = (
  ctx: RouterContext,
  next: () => Promise<void>
) => Promise<void>;

export type MiddlewareCollection = Middleware[];

export type StatusCodeMapping = Map<ErrorCode | "default", HttpStatusCode>;

export enum ErrorCode {
  UnhandledError = "unhandled_error",
  AccessDenied = "access_denied"
}

// Generic types for JSONAPI document structure.

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

export type Metadata = {
  [key: string]: string | number | boolean | Metadata;
};

export type JsonApiDocument<
  ResourceT = Resource,
  RelatedResourcesT = Resource
> = {
  data: ResourceT | ResourceT[];
  errors?: JsonApiError[];
  meta?: Metadata;
  included?: RelatedResourcesT[];
};

export type JsonApiErrorDocument<ErrorCodeT = ErrorCode> = {
  errors?: JsonApiError<ErrorCodeT>[];
  meta?: Metadata;
};

export type JsonApiRequest = {
  data?: Resource;
  meta?: Metadata;
};

export type JsonApiError<ErrorCodeT = ErrorCode> = {
  status: HttpStatusCode;
  code: ErrorCodeT;
  title: string;
  detail: string;
};

export type Links = {};

export type Meta = {};

export type Operation = {
  op: string;
  data: Resource;
  included: Resource[];
  ref: {
    type: string;
    id: string;
    lid: string;
    relationship: string;
  };
  params: {
    include: string[];
    sort: {};
    filter: { [key: string]: string };
    page: {};
    fields: { [key: string]: string[] };
  };
  links: Links;
  meta: Meta;
};

export type OperationResponse = {
  data: Resource | Resource[] | null;
};
