import { KnexProcessor, Operation, JsonApiErrors, HasId } from "../jsonapi-ts";
import { sign } from "jsonwebtoken";
import Session from "../resources/Session";
import { v4 as uuid } from "uuid";

export default class SessionProcessor<
  ResourceT extends Session
  > extends KnexProcessor<ResourceT> {
  public static resourceClass = Session;

  public async add(op: Operation): Promise<HasId> {
    const user = await this.knex("users")
      .where({ username: op.data.attributes.username })
      .first();

    const isLoggedIn = user && user.password === op.data.attributes;

    if (!isLoggedIn) {
      throw JsonApiErrors.AccessDenied();
    }

    const { id, password, ...publicUser } = user;

    const secureData = {
      type: "user",
      id: String(user.id),
      attributes: {
        ...publicUser
      }
    };
    const token = sign(secureData, process.env.SESSION_KEY, {
      subject: secureData.id,
      expiresIn: "1d"
    });

    const session = {
      token,
      id: uuid(),
      userId: user.id
    };

    return session;
  }
}
