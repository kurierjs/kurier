import { KnexProcessor, Operation, JsonApiErrors, HasId } from "../jsonapi-ts";
import { sign } from "jsonwebtoken";
import Session from "../resources/Session";
import { v4 as uuid } from "uuid";

export default class SessionProcessor<ResourceT extends Session> extends KnexProcessor<ResourceT> {
  public static resourceClass = Session;

  public async add(op: Operation): Promise<HasId> {
    const userFromDB = await this.knex("users")
      .where({ email: op.data.attributes.email })
      .first();

    const isLoggedIn = userFromDB && userFromDB.password === op.data.attributes.password;

    if (!isLoggedIn) {
      throw JsonApiErrors.AccessDenied();
    }

    const { id, password, ...publicUser } = userFromDB;

    const token = sign(
      {
        id,
        type: "user",
        attributes: {
          ...publicUser
        }
      },
      "session_key_test",
      {
        subject: String(id),
        expiresIn: "1d"
      }
    );

    const session = {
      token,
      id: uuid(),
      user_id: userFromDB.id
    };

    return session;
  }
}
