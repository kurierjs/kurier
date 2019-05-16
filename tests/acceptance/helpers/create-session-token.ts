import app from "../../dummy/src/app";
import { Resource } from "../../../src";

export default async function createSessionToken(email: string, password: string): Promise<string> {
  const attributes = { email, password };

  const [result] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: {
        attributes,
        type: "session",
        relationships: {}
      },
      ref: {
        type: "session"
      }
    }
  ]);

  return `Bearer ${(<Resource>result.data).attributes.token}`;
}
