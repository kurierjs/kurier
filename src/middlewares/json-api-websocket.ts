import { Server } from "ws";

import { ApplicationInterface, JsonApiDocument, Operation } from "../types";
import ApplicationInstance from "../application-instance";
import { runHookFunctions } from "../utils/hooks";

export default function jsonApiWebSocket(websocketServer: Server, app: ApplicationInterface) {
  websocketServer.on("connection", (connection, req) => {
    connection.on("message", async (message: Buffer) => {
      try {
        const appInstance = new ApplicationInstance(app);

        if (!message) {
          return;
        }

        const { meta, operations } = JSON.parse(message.toString()) as JsonApiDocument;

        const hookParameters = {
          headers: req.headers,
          connection: req.connection,
          socket: req.socket,
        };

        await runHookFunctions(appInstance, "beforeAuthentication", hookParameters);

        // Get user.
        if (meta && meta.token) {
          appInstance.user = await appInstance.getUserFromToken(meta.token as string);
        }

        await runHookFunctions(appInstance, "beforeRequestHandling", hookParameters);

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
