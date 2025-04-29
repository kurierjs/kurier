import * as express from "express";
import { compose } from "compose-middleware";
import ApplicationInstance from "../application-instance";

import {
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertErrorToHttpResponse,
} from "../utils/http-utils";
import jsonApiErrors from "../errors/json-api-errors";
import { ApplicationInterface, TransportLayerOptions } from "../types";
import { runHookFunctions } from "../utils/hooks";
import { isEquivalent } from "../utils/object";

export default function jsonApiExpress(
  app: ApplicationInterface,
  transportLayerOptions: TransportLayerOptions = {
    httpBodyPayload: "1mb",
    httpStrictMode: false,
  },
  ...middlewares: express.RequestHandler[]
) {
  const { httpBodyPayload, httpStrictMode } = transportLayerOptions;

  const checkStrictMode = async (req: express.Request, res: express.Response, next: () => any) => {
    if (!httpStrictMode) {
      return next();
    }

    if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("application/vnd.api+json")) {
      res
        .status(400)
        .json(convertErrorToHttpResponse(jsonApiErrors.BadRequest("Content-Type must be application/vnd.api+json")));
    } else {
      return next();
    }
  };

  const jsonApiExpress = async (req: express.Request, res: express.Response, next: () => any) => {
    const appInstance = new ApplicationInstance(app);

    const reqHookParameters = {
      headers: req.headers,
      connection: req.connection,
      socket: req.socket,
    };

    await runHookFunctions(appInstance, "beforeAuthentication", reqHookParameters);

    try {
      await authenticate(appInstance, req);
    } catch (error) {
      res.status(+error.status).json(convertErrorToHttpResponse(error));
      return next();
    }

    req.href = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    req.urlData = urlData(appInstance, req.path);

    await runHookFunctions(appInstance, "beforeRequestHandling", reqHookParameters);

    if (req.method === "PATCH" && req.urlData.resource === "bulk") {
      res.send(await handleBulkEndpoint(appInstance, req.body.operations, req));
      return next();
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, req);

    // Express doesn't let you pass the headers as a manipulable object, so we'll
    // capture a shallow copy and then set them after the hook executes.
    const initialHeaders = extractHeaders(res);

    const respHookParameters = {
      headers: extractHeaders(res),
      responseBody: body,
      status,
      socket: res.socket,
    };

    await runHookFunctions(appInstance, "beforeResponse", respHookParameters);

    if (!isEquivalent(initialHeaders, respHookParameters.headers)) {
      // Sync up headers that were set in the hook.
      for (let header of Object.keys(respHookParameters.headers)) {
        res.setHeader(header, respHookParameters.headers[header]);
      }
    }

    res.status(status).json(body);
    return next();
  };

  return compose([
    checkStrictMode,
    express.json({
      type: httpStrictMode ? "application/vnd.api+json" : "application/json",
      strict: false,
      limit: httpBodyPayload,
    }),
    ...middlewares,
    jsonApiExpress,
  ]);
}

function extractHeaders(response: express.Response): Record<string, number | string | string[]> {
  const headerKeys = response.getHeaderNames();
  const result = {};

  for (let key of headerKeys) {
    result[key] = response.getHeader(key);
  }

  return result;
}
