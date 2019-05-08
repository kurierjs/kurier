import Session from "../resources/session";
import KnexProcessor from "./knex-processor";
import { Operation, HasId, DEFAULT_PRIMARY_KEY } from "../types";
import jsonApiErrors from "../json-api-errors";
import { randomBytes } from "crypto";
import { sign } from "jsonwebtoken";
import Password from "../attribute-types/password";

export default class SessionProcessor<T extends Session> extends KnexProcessor<T> {
  public static resourceClass = Session;

  public async add(op: Operation): Promise<HasId> {
    const fields = Object.keys(op.data.attributes)
      .filter(attribute => this.resourceClass.schema.attributes[attribute] !== Password)
      .map(attribute => ({ [attribute]: op.data.attributes[attribute] }))
      .reduce((attributes, attribute) => ({ ...attributes, ...attribute }), {});

    if (Object.keys(fields).length === 0) {
      throw jsonApiErrors.InvalidData();
    }

    const userType = this.resourceClass.schema.relationships.user.type();

    const user = await this.knex(this.appInstance.app.serializer.resourceTypeToTableName(userType.type))
      .where(fields)
      .first();

    if (!user) {
      throw jsonApiErrors.AccessDenied();
    }

    const isLoggedIn = await this.appInstance.app.services.login(op, user);

    if (!isLoggedIn) {
      throw jsonApiErrors.AccessDenied();
    }

    const userId = String(user.id);

    delete user.id;

    const secureData = {
      type: userType.type,
      id: userId,
      attributes: {
        ...user
      },
      relationships: {}
    };

    const token = sign(secureData, process.env.SESSION_KEY, {
      subject: secureData.id,
      expiresIn: "1d"
    });

    const session = {
      token,
      [this.appInstance.app.serializer.attributeToColumn(
        `${userType.type}_${userType.schema.primaryKeyName || DEFAULT_PRIMARY_KEY}`
      )]: userId,
      id: randomBytes(16).toString("hex")
    };

    return session;
  }
}
