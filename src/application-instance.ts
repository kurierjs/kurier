import { decode } from "jsonwebtoken";
import { Knex } from "knex";

import Resource from "./resource";
import OperationProcessor from "./processors/operation-processor";
import { Operation, OperationResponse, NoOpTransaction, ApplicationInterface, VendorRequest } from "./types";
import jsonApiErrors from "./errors/json-api-errors";
import User from "./resources/user";
import UserManagementAddon, { UserManagementAddonOptions } from "./addons/user-management";
import { runHookFunctions } from "./utils/hooks";

export default class ApplicationInstance {
  public user: User | undefined;
  public transaction: Knex.Transaction | NoOpTransaction;

  constructor(public app: ApplicationInterface) {}

  async processorFor(resourceType: string): Promise<OperationProcessor<Resource> | undefined> {
    return this.app.processorFor(resourceType, this);
  }

  async getUserFromToken(token: string, request?: VendorRequest): Promise<User | undefined> {
    const tokenPayload = decode(token);
    let userIdSourceKey = "";

    const userManagementAddonOptions = this.app.getAddonOptions(UserManagementAddon) as UserManagementAddonOptions;

    if (userManagementAddonOptions) {
      userIdSourceKey = userManagementAddonOptions.jwtClaimForUserID as string;
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

    let op = {
      op: "identify",
      ref: {
        type: "user",
        id,
      },
      params: {},
    } as Operation;

    if (userManagementAddonOptions.includeTokenInIdentifyOpDataPayload) {
      op.data = {
        type: "user",
        attributes: {
          token,
        },
        relationships: {},
      };
    }

    const updateOperation = (updatedOperation: Operation) => {
      op = updatedOperation;
    };

    runHookFunctions(this, "beforeExecutingIdentifyOperation", { op, request, updateOperation });

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
