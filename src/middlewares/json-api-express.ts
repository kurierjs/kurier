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

    if (req.headers["content-type"] !== "application/vnd.api+json") {
      res
        .status(400)
        .json(convertErrorToHttpResponse(jsonApiErrors.BadRequest("Content-Type must be application/vnd.api+json")));
    } else {
      return next();
    }
  };

  const jsonApiExpress = async (req: express.Request, res: express.Response, next: () => any) => {
    const appInstance = new ApplicationInstance(app);

    const hookParameters = {
      headers: req.headers,
      connection: req.connection,
      socket: req.socket,
    };

    await runHookFunctions(appInstance, "beforeAuthentication", hookParameters);

    try {
      await authenticate(appInstance, req);
    } catch (error) {
      res.status(+error.status).json(convertErrorToHttpResponse(error));
      return next();
    }

    req.href = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    req.urlData = urlData(appInstance, req.path);

    await runHookFunctions(appInstance, "beforeRequestHandling", hookParameters);

    if (req.method === "PATCH" && req.urlData.resource === "bulk") {
      res.send(await handleBulkEndpoint(appInstance, req.body.operations));
      return next();
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, req);
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
