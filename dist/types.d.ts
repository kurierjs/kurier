import { RouterContext } from "koa-router";
import OperationProcessor from "./operation-processor";
export declare enum HttpStatusCode {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    InternalServerError = 500
}
export declare enum ResourceOperations {
    Get = 0,
    Add = 1
}
export declare type AuthenticatedRequest = {
    headers: {
        authorization: string;
    };
};
export declare type AuthenticatedContext = RouterContext & {
    user?: Resource;
};
export declare type OperationDecorator = (operationProcessor: OperationProcessor, operationCallback: Function, ...middlewareArguments: any[]) => ((...args: any[]) => any);
export declare type Middleware = (ctx: RouterContext, next: () => Promise<void>) => Promise<void>;
export declare type MiddlewareCollection = Middleware[];
export declare type StatusCodeMapping = Map<ErrorCode | "default", HttpStatusCode>;
export declare enum ErrorCode {
    UnhandledError = "unhandled_error",
    AccessDenied = "access_denied"
}
export declare type ResourceTypeRelationships = {
    [key: string]: ResourceRelationships;
};
export declare type ResourceRelationships = {
    data: ResourceRelationship | ResourceRelationship[];
};
export declare type ResourceRelationship = {
    type: string;
    id: string;
};
export declare type Resource = {
    type: string;
    id?: string;
    attributes: {};
    relationships?: ResourceTypeRelationships;
};
export declare type Metadata = {
    [key: string]: string | number | boolean | Metadata;
};
export declare type JsonApiDocument<ResourceT = Resource, RelatedResourcesT = Resource> = {
    data: ResourceT | ResourceT[];
    errors?: JsonApiError[];
    meta?: Metadata;
    included?: RelatedResourcesT[];
};
export declare type JsonApiErrorDocument<ErrorCodeT = ErrorCode> = {
    errors?: JsonApiError<ErrorCodeT>[];
    meta?: Metadata;
};
export declare type JsonApiRequest = {
    data?: Resource;
    meta?: Metadata;
};
export declare type JsonApiError<ErrorCodeT = ErrorCode> = {
    status: HttpStatusCode;
    code: ErrorCodeT;
    title: string;
    detail: string;
};
