import Authorize from "../decorators/authorize";
import jsonApiErrors from "../json-api-errors";
import { Operation, HasId } from "../types";
import User from "../resources/user";
import KnexProcessor from "./knex-processor";
import Password from "../attribute-types/password";

export default class UserProcessor<T extends User> extends KnexProcessor<T> {
  public static resourceClass = User;

  async identify(op: Operation): Promise<HasId[]> {
    return super.get({ ...op, params: {} });
  }

  async add(op: Operation): Promise<HasId> {
    const fields = Object.keys(op.data.attributes)
      .filter(attribute => this.resourceClass.schema.attributes[attribute] !== Password)
      .map(attribute => ({ [attribute]: op.data.attributes[attribute] }))
      .reduce((attributes, attribute) => ({ ...attributes, ...attribute }), {});

    const id = Date.now();

    const encryptedPassword = await this.appInstance.app.services.password(op);

    await this.knex("users").insert({
      ...fields,
      ...encryptedPassword,
      id
    });

    const user = await this.knex("users")
      .where({ id })
      .first();

    return user;
  }

  @Authorize()
  async get(op: Operation): Promise<HasId[]> {
    const isRequestingSelfData = String(op.ref.id) === String(this.appInstance.user.id);

    if (isRequestingSelfData) {
      return super.get({
        ...op,
        params: {
          fields: {
            ...op.params.fields,
            user: (op.params.fields && op.params.fields["user"] ? op.params.fields["user"] : [])
              .concat(Object.keys(this.resourceClass.schema.attributes))
              .filter(attribute => this.resourceClass.schema.attributes[attribute] !== Password)
          }
        }
      });
    }

    throw jsonApiErrors.AccessDenied();
  }
}
