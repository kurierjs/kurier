import * as dasherize from "dasherize";
import "koa-body";
import Router, { RouterContext } from "koa-router";
import { Log } from "logepi";
import * as pluralize from "pluralize";
import uncamelcase from "uncamelcase";

import {
  ErrorCode,
  HttpStatusCode,
  JsonApiDocument,
  JsonApiRequest,
  MiddlewareCollection,
  Resource,
  ResourceOperations,
  StatusCodeMapping
} from "./types";

export default abstract class OperationProcessor<
  ResourceT = Resource,
  RelatedResourcesT = Resource
> {
  /**
   * Stores the internal handlers for all operations.
   */
  private operationHandlers: MiddlewareCollection = [];

  /**
   * Stores which HTTP verbs will expose each controller method.
   */
  private operationHttpVerbs: ("get" | "post")[] = [];

  /**
   * Maps error codes to HTTP status codes.
   */
  private errorStatusToHttpCodes: StatusCodeMapping = {} as StatusCodeMapping;

  /**
   * Returns all elements of a resource collection. If implemented
   * in a derived class, this handler takes care of the GET /:type route.
   */
  async get?(
    id: string | undefined,
    ctx: RouterContext
  ): Promise<JsonApiDocument<ResourceT, RelatedResourcesT>>;

  /**
   * Requests a new, non-persistent resource. If implemented in a derived
   * class, this handler controls the POST /type route, with no body
   * content on incoming requests.
   */
  async add?(
    data: ResourceT,
    ctx: RouterContext
  ): Promise<JsonApiDocument<ResourceT, RelatedResourcesT>>;

  constructor(httpRouter: Router, public resourceName: string) {
    this.configureErrorHandler();
    this.configureOperations(httpRouter);
  }

  /**
   * Injects all necessary routes to provide read/write access
   * to resources.
   *
   * @param httpRouter {Router} - The API's router.
   */
  private configureOperations(httpRouter: Router) {
    this.configureGetOperation(httpRouter);
    this.configureAddRoute(httpRouter);
  }

  /**
   * Binds the built-in handler for GET /:type.
   */
  private configureGetOperation(httpRouter: Router) {
    this.operationHandlers[
      ResourceOperations.Get
    ] = this.executeGetOperation.bind(this);
    this.operationHttpVerbs[ResourceOperations.Get] = "get";

    this.configureOperationFor(ResourceOperations.Get, httpRouter, this.get);
  }

  /**
   * Binds the built-in handler for POST /:type.
   */
  private configureAddRoute(httpRouter: Router) {
    this.operationHandlers[
      ResourceOperations.Add
    ] = this.executeAddOperation.bind(this);
    this.operationHttpVerbs[ResourceOperations.Add] = "post";

    this.configureOperationFor(ResourceOperations.Add, httpRouter, this.add);
  }

  // TODO: HTTP Concerns should be removed from this class.

  /**
   * Configures which HTTP status codes are returned for each error code.
   * By default, any handled error returns 400. Auth-related errors are
   * set to return 401/403 as needed.
   */
  protected configureErrorHandler() {
    this.errorStatusToHttpCodes = new Map<
      ErrorCode | "default",
      HttpStatusCode
    >([
      ["default", HttpStatusCode.BadRequest],
      [ErrorCode.AccessDenied, HttpStatusCode.Unauthorized]
    ]);
  }

  /**
   * Injects the built-in handler for a given controller method
   * into the router, provided the controller implements a handler
   * for it.
   */
  private configureOperationFor(
    method: ResourceOperations,
    router: Router,
    handler?: Function
  ) {
    if (!handler) {
      return;
    }

    const httpVerb = this.operationHttpVerbs[method];

    Log.info("Route configuration started", {
      tags: { verb: httpVerb, resourceType: this.resourceName }
    });

    const endpoint = `/${dasherize(
      pluralize(uncamelcase(this.resourceName))
    ).replace(/ /g, "")}${httpVerb === "get" ? "/:id?" : ""}`;

    router[httpVerb](
      endpoint,
      this.handleError.bind(this),
      this.operationHandlers[method].bind(this)
    );

    Log.info("Route configuration finished", {
      tags: { verb: httpVerb, resourceType: this.resourceName }
    });
  }

  /**
   * This middleware wraps the entire request handling in a try/catch
   * block. If anything fails, it delegates to the `respondWithError`
   * built-in method to report an error with the JSONAPI format.
   */
  private async handleError(ctx: RouterContext, next: () => Promise<void>) {
    try {
      await next();
    } catch (error) {
      Log.info("Handled error detected, delegating to responder", {
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
  private respondWithError(error: ErrorCode | Error, ctx: RouterContext) {
    if (typeof error === "string") {
      const httpStatus =
        this.errorStatusToHttpCodes.get(error as ErrorCode) ||
        this.errorStatusToHttpCodes.get("default");

      ctx.body = {
        errors: [
          {
            code: error as ErrorCode,
            status: httpStatus
          }
        ]
      } as JsonApiDocument;

      ctx.status = httpStatus as number;
    } else {
      const errorObject = error as Error;
      const httpStatus = HttpStatusCode.InternalServerError;

      ctx.body = {
        errors: [
          {
            code: ErrorCode.UnhandledError,
            status: httpStatus,
            title: errorObject.message,
            detail: errorObject.stack
          }
        ]
      } as JsonApiDocument;

      ctx.status = httpStatus as number;
    }
  }

  /**
   * Returns a collection of resources or a single, uniquely-identified resource.
   */
  private async executeGetOperation(
    ctx: RouterContext,
    next: () => Promise<void>
  ) {
    const callback = (this.get as Function).bind(this);

    Log.debug("Routing request to route handler", {
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
  private async executeAddOperation(
    ctx: RouterContext,
    next: () => Promise<void>
  ) {
    const request = ctx.request.body as JsonApiRequest;
    const callback = (this.add as Function).bind(this);

    Log.debug("Routing request to route handler", {
      tags: {
        resourceType: this.resourceName,
        middleware: "routePost"
      }
    });

    ctx.body = request.data
      ? await callback(request.data as Resource, ctx)
      : await callback(ctx);

    ctx.status = 201;

    return next();
  }
}
