import { URL } from "url";

import { ApplicationInterface, Operation, VercelRequest, VercelResponse } from "../types";

import ApplicationInstance from "../application-instance";

import {
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertErrorToHttpResponse,
  createHttpHeaderProxy,
} from "../utils/http-utils";

import jsonApiErrors from "../errors/json-api-errors";
import { TransportLayerOptions } from "../types";
import { runHookFunctions } from "../utils/hooks";

const checkStrictMode = async (
  transportLayerOptions: TransportLayerOptions,
  req: VercelRequest,
  res: VercelResponse,
) => {
  if (!transportLayerOptions.httpStrictMode) {
    return;
  }

  if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("application/vnd.api+json")) {
    res.status(400);
    res.send(convertErrorToHttpResponse(jsonApiErrors.BadRequest("Content-Type must be application/vnd.api+json")));
  } else {
    // Vercel's magic body parser is limited to certain MIME types. The JSONAPI MIME type isn't one of them.
    // As a result, `req.body` becomes undefined. So, we trick Vercel into thinking this is an `application/json`
    // request, and keep parsing the data as JSON.
    req.headers["content-type"] = "application/json";
  }
};

export default function jsonApiVercel(
  app: ApplicationInterface,
  transportLayerOptions: TransportLayerOptions = {
    httpStrictMode: false,
  },
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    await checkStrictMode(transportLayerOptions, req, res);

    if (transportLayerOptions.httpStrictMode && res.statusCode === 400) {
      return;
    }

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
      res.status(error.status);
      res.json(convertErrorToHttpResponse(error));
    }

    // This `href` property is used later in the parsing process to extract query parameters.
    // Protocol is there just to make a valid URL. It has no behavioural signifance.
    req.href = `https://${req.headers.host}${req.url!}`;

    const urlObject = new URL(req.href);
    req.urlData = urlData(appInstance, urlObject.pathname);

    await runHookFunctions(appInstance, "beforeRequestHandling", hookParameters);

    if (req.method === "PATCH" && req.urlData.resource === "bulk") {
      const bulkResponse = await handleBulkEndpoint(appInstance, req.body.operations as Operation[], req);
      res.json(bulkResponse);
      return;
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, req);

    const respHookParameters = {
      headers: createHttpHeaderProxy(res),
      body,
      status,
      socket: res.socket,
    };

    await runHookFunctions(appInstance, "beforeResponse", respHookParameters);

    res.status(status);
    res.json(body);
  };
}
