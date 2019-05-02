import { Server } from "ws";
import Application from "../application";
import { JsonApiDocument } from "../types";

export default function jsonApiWebSocket(
  websocketServer: Server,
  app: Application
) {
  websocketServer.on("connection", connection => {
    connection.on("message", async message => {
      if (!message) {
        return;
      }

      const { operations } = JSON.parse(message.toString()) as JsonApiDocument;

      const response = await app.executeOperations(operations);

      connection.send(
        JSON.stringify({
          operations: response
        })
      );
    });
  });
}
