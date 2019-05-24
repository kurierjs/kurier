import app from "../../test-app/app";
import factory from "../factories/user";
import { HasId, Resource } from "../../../../src";

export default async function authenticateUser(): Promise<{ token: string, user: HasId }> {
  const { email, password } = factory.userToAuthenticate.attributes;

  const [createdUser] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: factory.userToAuthenticate,
      ref: {
        type: "user"
      }
    }
  ]);

  const [result] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: {
        attributes: { email, password },
        type: "session",
        relationships: {}
      },
      ref: {
        type: "session"
      }
    }
  ]);
  return { user: createdUser.data as HasId, token: `Bearer ${(<Resource>result.data).attributes.token}` };
}
