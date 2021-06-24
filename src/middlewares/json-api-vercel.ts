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

export default function jsonApiVercel(app: Application) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const appInstance = new ApplicationInstance(app);

    if (['POST', 'PUT', 'PATCH'].includes(req.method!) && typeof req.body === 'string') {
      req.body = JSON.parse(req.body);
    }

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
