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

    if (process.env.AWS_REGION) {
      // This means we're not in localhost.
      req["href"] = `https://${req.headers.host}${req.url!}`;
    } else {
      // This means we're in development. We won't use HTTPS here.
      req["href"] = `http://${req.headers.host}${req.url!}`;
    }

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
