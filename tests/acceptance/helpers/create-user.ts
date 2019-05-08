import userFactory from "@acceptance/factories/user";
import app from "@dummy/app";
import User from "@dummy/resources/user";

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
