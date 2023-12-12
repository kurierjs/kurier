import { Context, Middleware } from "koa";
import * as koaBody from "koa-body";
import * as compose from "koa-compose";
import ApplicationInstance from "../application-instance";
import {
  authenticate,
  convertErrorToHttpResponse,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  urlData,
} from "../utils/http-utils";
import jsonApiErrors from "../errors/json-api-errors";
import { ApplicationInterface, TransportLayerOptions } from "../types";
import { runHookFunctions } from "../utils/hooks";

export default function jsonApiKoa(
  app: ApplicationInterface,
  transportLayerOptions: TransportLayerOptions = {
    httpBodyPayload: "1mb",
    httpStrictMode: false,
  },
  ...middlewares: Middleware[]
) {
  const { httpBodyPayload, httpStrictMode } = transportLayerOptions;

  const checkStrictMode = async (ctx: Context, next: () => Promise<any>) => {
    if (!httpStrictMode) {
      return next();
    }

    if (!ctx.headers["content-type"] || !ctx.headers["content-type"].startsWith("application/vnd.api+json")) {
      ctx.status = 400;
      ctx.body = convertErrorToHttpResponse(jsonApiErrors.BadRequest("Content-Type must be application/vnd.api+json"));
    }

    return next();
  };

  const jsonApiKoa = async (ctx: Context, next: () => Promise<any>) => {
    if (httpStrictMode && ctx.status === 400) {
      return next();
    }
    const appInstance = new ApplicationInstance(app);

    const hookParameters = {
      headers: ctx.headers,
      connection: ctx.req.connection,
      socket: ctx.socket,
    };

    await runHookFunctions(appInstance, "beforeAuthentication", hookParameters);

    try {
      await authenticate(appInstance, ctx.request);
    } catch (error) {
      ctx.body = convertErrorToHttpResponse(error);
      ctx.status = error.status;
      return next();
    }

    ctx.request.urlData = urlData(appInstance, ctx.path);

    await runHookFunctions(appInstance, "beforeRequestHandling", hookParameters);

    if (ctx.method === "PATCH" && ctx.request.urlData.resource === "bulk") {
      ctx.body = await handleBulkEndpoint(appInstance, ctx.request.body.operations);
      return next();
    }

    try {
      const { body, status } = await handleJsonApiEndpoint(appInstance, ctx.request);
      ctx.body = body;
      ctx.status = status;
    } catch (error) {
      ctx.body = convertErrorToHttpResponse(error);
      ctx.status = error.status;
    } finally {
      return next();
    }
  };

  const koaBodySettings = {
    json: true,
    jsonLimit: httpBodyPayload,
  };

  return compose([checkStrictMode, koaBody(koaBodySettings), ...middlewares, jsonApiKoa]);
}
