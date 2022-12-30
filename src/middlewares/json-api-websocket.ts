import { Server } from "ws";

import Application from "../application";
import { JsonApiDocument, Operation } from "../types";
import ApplicationInstance from "../application-instance";

export default function jsonApiWebSocket(websocketServer: Server, app: Application) {
  websocketServer.on("connection", (connection, req) => {
    connection.on("message", async (message: Buffer) => {
      try {
        const appInstance = new ApplicationInstance(app);

        appInstance.transportLayerContext = {
          ip: req.socket.remoteAddress || req.headers["x-forwarded-for"]?.toString().split(",")[0].trim(),
          headers: req.headers,
        };

        if (!message) {
          return;
        }

        const { meta, operations } = JSON.parse(message.toString()) as JsonApiDocument;

        // Get user.
        if (meta && meta.token) {
          appInstance.user = await appInstance.getUserFromToken(meta.token as string);
        }

        // Execute and reply.
        const response = await appInstance.app.executeOperations(operations as Operation[], appInstance);

        connection.send(
          JSON.stringify({
            operations: response,
          }),
        );
      } catch (e) {
        connection.send(
          JSON.stringify({
            errors: [e],
          }),
        );
      }
    });
  });
}
