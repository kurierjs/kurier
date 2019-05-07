import context from "../../transaction";
import userFactory from "../factories/user";
import app from "../../dummy/src/app";
import User from "../../dummy/src/resources/user";

export default async function createUser(user = null): Promise<User> {
  let attributes = user;

  if (user === null) {
    attributes = userFactory.build();
  }

  const [result] = await app.executeOperations([
    {
      op: "add",
      params: {},
      data: {
        attributes,
        type: "user",
        relationships: {}
      },
      ref: {
        type: "user"
      }
    }
  ]);

  return result.data[0];
}
