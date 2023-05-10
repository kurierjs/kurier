import { decode } from "jsonwebtoken";
import { Knex } from "knex";

import Resource from "./resource";
import OperationProcessor from "./processors/operation-processor";
import { Operation, OperationResponse, NoOpTransaction, ApplicationInterface } from "./types";
import jsonApiErrors from "./errors/json-api-errors";
import User from "./resources/user";
import UserManagementAddon, { UserManagementAddonOptions } from "./addons/user-management";

export default class ApplicationInstance {
  public user: User | undefined;
  public transaction: Knex.Transaction | NoOpTransaction;

  constructor(public app: ApplicationInterface) {}

  async processorFor(resourceType: string): Promise<OperationProcessor<Resource> | undefined> {
    return this.app.processorFor(resourceType, this);
  }

  async getUserFromToken(token: string): Promise<User | undefined> {
    const tokenPayload = decode(token);
    let userIdSourceKey = "";

    const userManagementAddon = this.app.addons.find(({ addon }) => addon === UserManagementAddon);

    if (userManagementAddon) {
      const options = userManagementAddon.options as UserManagementAddonOptions;
      userIdSourceKey = options.jwtClaimForUserID as string;
    } else {
      userIdSourceKey = "id";
    }

    if (!tokenPayload) {
      throw jsonApiErrors.InvalidToken();
    }

    const id = tokenPayload[userIdSourceKey];

    if (!id) {
      throw jsonApiErrors.InvalidToken();
    }

    const op = {
      op: "identify",
      ref: {
        type: "user",
        id,
      },
      params: {},
    } as Operation;

    let user: OperationResponse;

    try {
      [user] = await this.app.executeOperations([op], this);
    } catch (error) {
      if (error.code === "not_found") {
        throw jsonApiErrors.InvalidToken();
      }

      throw error;
    }

    this.transaction = await this.app.createTransaction();

    const data = <Resource>user.data;

    if (this.app.services.roles) {
      data.attributes["roles"] = await this.app.services.roles.bind(this)(user.data as User);
    }

    if (this.app.services.permissions) {
      data.attributes["permissions"] = await this.app.services.permissions.bind(this)(user.data as User);
    }

    await this.transaction.commit();
    return data;
  }
}
