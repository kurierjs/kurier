import {URL} from "url";

import { Operation, VercelRequest, VercelResponse } from "../types";

import Application from "../application";
import ApplicationInstance from "../application-instance";

import {
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertErrorToHttpResponse
} from "../utils/http-utils";

import jsonApiErrors from "../errors/json-api-errors";

const checkStrictMode = async (app: Application, req: VercelRequest, res: VercelResponse) => {
  if (!app.transportLayerOptions.strictMode) {
    return;
  }

  if (req.headers["content-type"] !== 'application/vnd.api+json') {
    res.status(400);
    res.send(convertErrorToHttpResponse(jsonApiErrors.BadRequest("Content-Type must be application/vnd.api+json")));
  } else {
    // Vercel's magic body parser is limited to certain MIME types. The JSONAPI MIME type isn't one of them.
    // As a result, `req.body` becomes undefined. So, we trick Vercel into thinking this is an `application/json`
    // request, and keep parsing the data as JSON.
    req.headers["content-type"] = 'application/json';
  }
};

export default function jsonApiVercel(app: Application) {
  return async (req: VercelRequest, res: VercelResponse) => {
    await checkStrictMode(app, req, res);
    const appInstance = new ApplicationInstance(app);

    try {
      await authenticate(appInstance, req);
    } catch (error) {
      res.status(error.status);
      res.json(convertErrorToHttpResponse(error));
    }

    // This `href` property is used later in the parsing process to extract query parameters.
    // Protocol is there just to make a valid URL. It has no behavioural signifance.
    req["href"] = `https://${req.headers.host}${req.url!}`;

    const urlObject = new URL(req["href"]);
    req["urlData"] = urlData(appInstance, urlObject.pathname);

    if (req.method === "PATCH" && req["urlData"].resource === "bulk") {
      const bulkResponse = await handleBulkEndpoint(appInstance, req.body.operations as Operation[]);
      res.json(bulkResponse);
      return;
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, req);
    res.status(status)
    res.json(body);
  }
}
