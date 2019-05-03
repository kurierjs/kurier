import * as escapeStringRegexp from "escape-string-regexp";
import { Context, Middleware } from "koa";
import * as koaBody from "koa-body";
import * as compose from "koa-compose";

import Application from "../application";
import JsonApiErrors from "../json-api-errors";
import {
  JsonApiDocument,
  JsonApiError,
  JsonApiErrorsDocument,
  Operation,
  OperationResponse
} from "../types";
import { parse } from "../utils/json-api-params";
import { camelize, singularize } from "../utils/string";
import ApplicationInstance from "../application-instance";
import Resource from "../resource";

const STATUS_MAPPING = {
  GET: 200,
  POST: 201,
  PATCH: 200,
  PUT: 200,
  DELETE: 204
};

export default function jsonApiKoa(
  app: Application,
  ...middlewares: Middleware[]
) {
  const jsonApiKoa = async (ctx: Context, next: () => Promise<any>) => {
    const appInstance = new ApplicationInstance(app);

    await authenticate(appInstance, ctx);

    const data = urlData(appInstance, ctx);

    if (ctx.method === "PATCH" && data.resource === "bulk") {
      await handleBulkEndpoint(appInstance, ctx);
      return await next();
    }

    ctx.urlData = data;

    return await handleJsonApiEndpoint(appInstance, ctx).then(() => next());
  };

  return compose([koaBody({ json: true }), ...middlewares, jsonApiKoa]);
}

async function authenticate(appInstance: ApplicationInstance, ctx: Context) {
  const authHeader = ctx.request.headers.authorization;
  let currentUser: typeof Resource;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const [, token] = authHeader.split(" ");
    currentUser = await appInstance.getUserFromToken(token);
  }

  appInstance.user = currentUser;
}

function urlData(appInstance: ApplicationInstance, ctx: Context) {
  const urlRegexp = new RegExp(
    `^(\/+)?((?<namespace>${escapeStringRegexp(
      appInstance.app.namespace
    )})(\/+|$))?(?<resource>[^\\s\/?]+)?(\/+)?((?<id>[^\\s\/?]+)?(\/+)?\(?<relationships>relationships)?(\/+)?)?` +
      "(?<relationship>[^\\s/?]+)?(/+)?$"
  );

  const { resource, id, relationships, relationship } =
    (ctx.path.match(urlRegexp) || {})["groups"] || ({} as any);

  return {
    id,
    resource,
    relationship,
    isRelationships: !!relationships
  };
}

async function handleBulkEndpoint(
  appInstance: ApplicationInstance,
  ctx: Context
) {
  const operations = await appInstance.app.executeOperations(
    ctx.request.body.operations || []
  );

  ctx.body = { operations };
}

async function handleJsonApiEndpoint(
  appInstance: ApplicationInstance,
  ctx: Context
) {
  const op: Operation = convertHttpRequestToOperation(ctx);
  if (["update", "remove"].includes(op.op) && !op.ref.id) return;

  try {
    const [
      result
    ]: OperationResponse[] = await appInstance.app.executeOperations([op]);

    ctx.body = convertOperationResponseToHttpResponse(ctx, result);
    ctx.status = STATUS_MAPPING[ctx.method];
  } catch (e) {
    const isJsonApiError = e && e.status;
    if (!isJsonApiError) console.error("JSONAPI-TS: ", e);

    const jsonApiError = isJsonApiError ? e : JsonApiErrors.UnhandledError();

    ctx.body = convertJsonApiErrorToHttpResponse(jsonApiError);
    ctx.status = jsonApiError.status;
  }
}

function convertHttpRequestToOperation(ctx: Context): Operation {
  const { id, resource, relationship } = ctx.urlData;
  const type = camelize(singularize(resource));

  const opMap = {
    GET: "get",
    POST: "add",
    PATCH: "update",
    PUT: "update",
    DELETE: "remove"
  };

  return {
    op: opMap[ctx.method],
    params: parse(ctx.href),
    ref: { id, type, relationship },
    data: ctx.request.body.data
  } as Operation;
}

function convertOperationResponseToHttpResponse(
  ctx: Context,
  operation: OperationResponse
): JsonApiDocument {
  const responseMethods = ["GET", "POST", "PATCH", "PUT"];

  if (responseMethods.includes(ctx.method)) {
    return { data: operation.data, included: operation.included };
  }
}

function convertJsonApiErrorToHttpResponse(
  error: JsonApiError
): JsonApiErrorsDocument {
  return { errors: [error] };
}
