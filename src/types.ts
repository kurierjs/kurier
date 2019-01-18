import { IRouterContext } from "koa-router";

export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  InternalServerError = 500
}

export enum ControllerMethod {
  GetById,
  GetAll,
  Post
}

export type UserSession = APIResourceAttributes & { id: string };

export type AuthenticatedRequest = {
  headers: {
    authorization: string;
  };
};

export type Middleware = (
  ctx: IRouterContext,
  next: () => Promise<void>
) => Promise<void>;

export type MiddlewareCollection = Middleware[];

export type APIRequestBodyContainer<T = APIResourceAttributes> = {
  body: APIRequest<T>;
};

export type StatusCodeMapping = Map<ErrorCode | "default", HttpStatusCode>;

export enum ErrorCode {
  UnhandledError = "unhandled_error"
}

// Generic types for JSONAPI document structure.

export type APIResourceRelationships = {
  [key in APIResourceType]?: APIDataContainer
};

export type APIResource<T = APIResourceAttributes> = {
  type: APIResourceType;
  id?: string;
  attributes: T;
  relationships?: APIResourceRelationships;
};

export type APIResourceCollection<T = APIResourceAttributes> = APIResource<T>[];

export type APIMetadata = {
  [key: string]: string | number | boolean | APIMetadata;
};

export type APIDataContainer<T = APIResourceAttributes> = {
  data: APIResource<T> | APIResourceCollection<T>;
};

export type APIResponse<T = APIResourceAttributes> = APIDataContainer<T> & {
  errors?: APIError[];
  meta?: APIMetadata;
  included?: APIResourceCollection;
};

export type APIRequest<T = APIResourceAttributes> = {
  data?: APIResource<T> | APIResourceCollection<T>;
  meta?: APIMetadata;
};

export type APIError = {
  status: HttpStatusCode;
  code: ErrorCode;
  title: string;
  detail: string;
};

// Exposed models.
export type APIResourceType = "resource";

export type APIResourceAttributes = {
  [key: string]: string | number | boolean | undefined;
};
