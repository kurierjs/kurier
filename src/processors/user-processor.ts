import Authorize from "../decorators/authorize";
import { Operation, HasId, DEFAULT_PRIMARY_KEY } from "../types";
import User from "../resources/user";
import KnexProcessor from "./knex-processor";
import Password from "../attribute-types/password";

export default class UserProcessor<T extends User> extends KnexProcessor<T> {
  public static resourceClass = User;

  async identify(op: Operation): Promise<HasId[] | HasId> {
    return super.get({ ...op, params: {} });
  }

  protected async generateId(): Promise<any> {}
  protected async encryptPassword(op: Operation): Promise<any> {
    throw new Error("You must implement a password encryption mechanism.");
  }

  async add(op: Operation): Promise<HasId> {
    const fields = Object.keys(op.data.attributes)
      .filter(attribute => this.resourceClass.schema.attributes[attribute] !== Password)
      .map(attribute => ({ [attribute]: op.data.attributes[attribute] }))
      .reduce((attributes, attribute) => ({ ...attributes, ...attribute }), {});

    const id = await this.generateId();

    const encryptedPassword = await this.encryptPassword(op);

    op.data.attributes = {
      ...fields,
      ...encryptedPassword
    };
    op.data.id = id;

    return super.add(op);
  }

  @Authorize()
  async get(op: Operation): Promise<HasId[] | HasId> {
    return super.get(op);
  }
}
