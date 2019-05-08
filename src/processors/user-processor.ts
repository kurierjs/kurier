import Authorize from "../decorators/authorize";
import { Operation, HasId, ResourceAttributes } from "../types";
import User from "../resources/user";
import KnexProcessor from "./knex-processor";
import Password from "../attribute-types/password";

export default class UserProcessor<T extends User> extends KnexProcessor<T> {
  public static resourceClass = User;

  async identify(op: Operation): Promise<HasId[]> {
    return super.get({ ...op, params: {} });
  }

  protected async encryptPassword(op: Operation): Promise<ResourceAttributes> {
    console.warn(
      "WARNING: You're using the default encryptPassword callback with UserManagementAddon." +
        "Your password is NOT being encrypted. Implement this callback in your addon configuration."
    );

    const passwordField = Object.keys(op.data.attributes).find(
      attribute => this.resourceClass.schema.attributes[attribute] === Password
    );

    return { password: op.data.attributes[passwordField] };
  }

  async add(op: Operation): Promise<HasId> {
    const fields = Object.keys(op.data.attributes)
      .filter(attribute => this.resourceClass.schema.attributes[attribute] !== Password)
      .map(attribute => ({ [attribute]: op.data.attributes[attribute] }))
      .reduce((attributes, attribute) => ({ ...attributes, ...attribute }), {});

    const id = Date.now();

    const encryptedPassword = await this.encryptPassword(op);
    const tableName = this.appInstance.app.serializer.resourceTypeToTableName(this.resourceClass.type);

    await this.knex(tableName).insert({
      ...fields,
      ...encryptedPassword,
      id
    });

    const user = await this.knex(tableName)
      .where({ id })
      .first();

    return user;
  }

  @Authorize()
  async get(op: Operation): Promise<HasId[]> {
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
}
