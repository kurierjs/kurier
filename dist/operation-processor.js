"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dasherize = require("dasherize");
require("koa-body");
const logepi_1 = require("logepi");
const pluralize = require("pluralize");
const uncamelcase_1 = require("uncamelcase");
const types_1 = require("./types");
class OperationProcessor {
    constructor(httpRouter, resourceName) {
        this.resourceName = resourceName;
        /**
         * Stores the internal handlers for all operations.
         */
        this.operationHandlers = [];
        /**
         * Stores which HTTP verbs will expose each controller method.
         */
        this.operationHttpVerbs = [];
        /**
         * Maps error codes to HTTP status codes.
         */
        this.errorStatusToHttpCodes = {};
        this.configureErrorHandler();
        this.configureOperations(httpRouter);
    }
    /**
     * Injects all necessary routes to provide read/write access
     * to resources.
     *
     * @param httpRouter {Router} - The API's router.
     */
    configureOperations(httpRouter) {
        this.configureGetOperation(httpRouter);
        this.configureAddRoute(httpRouter);
    }
    /**
     * Binds the built-in handler for GET /:type.
     */
    configureGetOperation(httpRouter) {
        this.operationHandlers[types_1.ResourceOperations.Get] = this.executeGetOperation.bind(this);
        this.operationHttpVerbs[types_1.ResourceOperations.Get] = "get";
        this.configureOperationFor(types_1.ResourceOperations.Get, httpRouter, this.get);
    }
    /**
     * Binds the built-in handler for POST /:type.
     */
    configureAddRoute(httpRouter) {
        this.operationHandlers[types_1.ResourceOperations.Add] = this.executeAddOperation.bind(this);
        this.operationHttpVerbs[types_1.ResourceOperations.Add] = "post";
        this.configureOperationFor(types_1.ResourceOperations.Add, httpRouter, this.add);
    }
    // TODO: HTTP Concerns should be removed from this class.
    /**
     * Configures which HTTP status codes are returned for each error code.
     * By default, any handled error returns 400. Auth-related errors are
     * set to return 401/403 as needed.
     */
    configureErrorHandler() {
        this.errorStatusToHttpCodes = new Map([
            ["default", types_1.HttpStatusCode.BadRequest],
            [types_1.ErrorCode.AccessDenied, types_1.HttpStatusCode.Unauthorized]
        ]);
    }
    /**
     * Injects the built-in handler for a given controller method
     * into the router, provided the controller implements a handler
     * for it.
     */
    configureOperationFor(method, router, handler) {
        if (!handler) {
            return;
        }
        const httpVerb = this.operationHttpVerbs[method];
        logepi_1.Log.info("Route configuration started", {
            tags: { verb: httpVerb, resourceType: this.resourceName }
        });
        const endpoint = `/${dasherize(pluralize(uncamelcase_1.default(this.resourceName))).replace(/ /g, "")}${httpVerb === "get" ? "/:id?" : ""}`;
        router[httpVerb](endpoint, this.handleError.bind(this), this.operationHandlers[method].bind(this));
        logepi_1.Log.info("Route configuration finished", {
            tags: { verb: httpVerb, resourceType: this.resourceName }
        });
    }
    /**
     * This middleware wraps the entire request handling in a try/catch
     * block. If anything fails, it delegates to the `respondWithError`
     * built-in method to report an error with the JSONAPI format.
     */
    async handleError(ctx, next) {
        try {
            await next();
        }
        catch (error) {
            logepi_1.Log.info("Handled error detected, delegating to responder", {
                tags: {
                    resourceType: this.resourceName,
                    middleware: "handleError"
                }
            });
            this.respondWithError(error, ctx);
        }
    }
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
    respondWithError(error, ctx) {
        if (typeof error === "string") {
            const httpStatus = this.errorStatusToHttpCodes.get(error) ||
                this.errorStatusToHttpCodes.get("default");
            ctx.body = {
                errors: [
                    {
                        code: error,
                        status: httpStatus
                    }
                ]
            };
            ctx.status = httpStatus;
        }
        else {
            const errorObject = error;
            const httpStatus = types_1.HttpStatusCode.InternalServerError;
            ctx.body = {
                errors: [
                    {
                        code: types_1.ErrorCode.UnhandledError,
                        status: httpStatus,
                        title: errorObject.message,
                        detail: errorObject.stack
                    }
                ]
            };
            ctx.status = httpStatus;
        }
    }
    /**
     * Returns a collection of resources or a single, uniquely-identified resource.
     */
    async executeGetOperation(ctx, next) {
        const callback = this.get.bind(this);
        logepi_1.Log.debug("Routing request to route handler", {
            tags: {
                resourceType: this.resourceName,
                middleware: "routeGetById"
            }
        });
        ctx.body = await callback(ctx.params.id, ctx);
        return next();
    }
    /**
     * Returns a newly-persisted or non-persisted resource. Newly-persisted resources
     * are objects that are permanently stored in the database, such as user accounts.
     * Non-persisted resources are volatile objects such as matchmakings or sessions.
     */
    async executeAddOperation(ctx, next) {
        const request = ctx.request.body;
        const callback = this.add.bind(this);
        logepi_1.Log.debug("Routing request to route handler", {
            tags: {
                resourceType: this.resourceName,
                middleware: "routePost"
            }
        });
        ctx.body = request.data
            ? await callback(request.data, ctx)
            : await callback(ctx);
        ctx.status = 201;
        return next();
    }
}
exports.default = OperationProcessor;
