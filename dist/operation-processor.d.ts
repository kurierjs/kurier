import "koa-body";
import Router, { RouterContext } from "koa-router";
import { JsonApiDocument, Resource } from "./types";
export default abstract class OperationProcessor<ResourceT = Resource, RelatedResourcesT = Resource> {
    resourceName: string;
    /**
     * Stores the internal handlers for all operations.
     */
    private operationHandlers;
    /**
     * Stores which HTTP verbs will expose each controller method.
     */
    private operationHttpVerbs;
    /**
     * Maps error codes to HTTP status codes.
     */
    private errorStatusToHttpCodes;
    /**
     * Returns all elements of a resource collection. If implemented
     * in a derived class, this handler takes care of the GET /:type route.
     */
    get?(id: string | undefined, ctx: RouterContext): Promise<JsonApiDocument<ResourceT, RelatedResourcesT>>;
    /**
     * Requests a new, non-persistent resource. If implemented in a derived
     * class, this handler controls the POST /type route, with no body
     * content on incoming requests.
     */
    add?(data: ResourceT, ctx: RouterContext): Promise<JsonApiDocument<ResourceT, RelatedResourcesT>>;
    constructor(httpRouter: Router, resourceName: string);
    /**
     * Injects all necessary routes to provide read/write access
     * to resources.
     *
     * @param httpRouter {Router} - The API's router.
     */
    private configureOperations;
    /**
     * Binds the built-in handler for GET /:type.
     */
    private configureGetOperation;
    /**
     * Binds the built-in handler for POST /:type.
     */
    private configureAddRoute;
    /**
     * Configures which HTTP status codes are returned for each error code.
     * By default, any handled error returns 400. Auth-related errors are
     * set to return 401/403 as needed.
     */
    protected configureErrorHandler(): void;
    /**
     * Injects the built-in handler for a given controller method
     * into the router, provided the controller implements a handler
     * for it.
     */
    private configureOperationFor;
    /**
     * This middleware wraps the entire request handling in a try/catch
     * block. If anything fails, it delegates to the `respondWithError`
     * built-in method to report an error with the JSONAPI format.
     */
    private handleError;
    /**
     * Creates a JSONAPI-compliant error response.
     *
     * If it's a handled error, it'll set the `code` and `status` fields
     * from the `errorCode` and the HTTP status mapping defined in the
     * `configureErrorHandler()` method.
     *
     * If it's an unhandled error, it'll fill the fields using the `Error`
     * object being thrown, with a 500 status code.
     */
    private respondWithError;
    /**
     * Returns a collection of resources or a single, uniquely-identified resource.
     */
    private executeGetOperation;
    /**
     * Returns a newly-persisted or non-persisted resource. Newly-persisted resources
     * are objects that are permanently stored in the database, such as user accounts.
     * Non-persisted resources are volatile objects such as matchmakings or sessions.
     */
    private executeAddOperation;
}
