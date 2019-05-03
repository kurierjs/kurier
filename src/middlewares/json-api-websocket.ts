import { Server } from "ws";

import Application from "../application";
import { JsonApiDocument } from "../types";
import ApplicationInstance from "../application-instance";

export default function jsonApiWebSocket(
  websocketServer: Server,
  app: Application
) {
  websocketServer.on("connection", connection => {
    connection.on("message", async (message: Buffer) => {
      try {
        const appInstance = new ApplicationInstance(app);

        if (!message) {
          return;
        }

        const { meta, operations } = JSON.parse(
          message.toString()
        ) as JsonApiDocument;

        // Get user.
        if (meta && meta.token) {
          appInstance.user = await appInstance.getUserFromToken(
            meta.token as string
          );
        }

        // Execute and reply.
        const response = await appInstance.app.executeOperations(operations);

        connection.send(
          JSON.stringify({
            operations: response
          })
        );
      } catch (e) {
        connection.send(
          JSON.stringify({
            errors: [e]
          })
        );
      }
    });
  });
}
