import * as express from "express";
import { compose } from "compose-middleware";
import Application from "../application";
import ApplicationInstance from "../application-instance";

import {
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertErrorToHttpResponse
} from "../utils/http-utils";

export default function jsonApiExpress(app: Application) {
  const jsonApiExpress = async (req: express.Request, res: express.Response, next: () => any) => {
    const baseUrl = new URL(`${req.protocol}://${req.get("host")}`);
    const appInstance = new ApplicationInstance(app, baseUrl);

    try {
      await authenticate(appInstance, req);
    } catch (error) {
      res.status(error.status).json(convertErrorToHttpResponse(error));
      return next();
    }

    req["href"] = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    req["urlData"] = urlData(appInstance, req.path);

    if (req.method === "PATCH" && req["urlData"].resource === "bulk") {
      res.send(await handleBulkEndpoint(appInstance, req.body.operations));
      return next();
    }

    const { body, status } = await handleJsonApiEndpoint(appInstance, req);
    res.status(status).json(body);
    return next();
  };

  return compose([express.json({ limit: app.transportLayerOptions?.httpBodyPayload }), jsonApiExpress]);
}
