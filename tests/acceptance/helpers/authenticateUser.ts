import app from "../../dummy/src/app";
import { Resource, HasId } from "../../../src";
import factory from "../factories/user";

export default async function authenticateUser(): Promise<{ token: string, user: HasId }> {
  const { email, password } = factory.usersToInsert[0].attributes;

  const [createdUser] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: factory.usersToInsert[0],
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
