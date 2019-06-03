import { decode } from "jsonwebtoken";
import * as Knex from "knex";

import Application from "./application";
import Resource from "./resource";
import OperationProcessor from "./processors/operation-processor";
import { Operation, OperationResponse } from "./types";
import jsonApiErrors from "./errors/json-api-errors";
import User from "./resources/user";
import JsonApiError from "./errors/error";

export default class ApplicationInstance {
  public user: User;
  public transaction: Knex.Transaction;

  constructor(public app: Application) {}

  async processorFor(resourceType: string): Promise<OperationProcessor<Resource> | undefined> {
    return this.app.processorFor(resourceType, this);
  }

  async getUserFromToken(token: string): Promise<User | undefined> {
    const tokenPayload = decode(token);

    if (!tokenPayload) {
      throw jsonApiErrors.InvalidToken();
    }

    const userId = tokenPayload["id"];

    if (!userId) return;

    const op = {
      op: "identify",
      ref: {
        type: "user",
        id: userId
      },
      params: {}
    } as Operation;

    let user: OperationResponse;

    try {
      [user] = await this.app.executeOperations([op]);
    } catch (e) {
      const error = e as JsonApiError;

      if (error.code === "not_found") {
        throw jsonApiErrors.InvalidToken();
      }

      throw error;
    }

    this.transaction = await this.app.createTransaction();

    const data = <Resource>user.data;

    data.attributes["roles"] = await this.app.services.roles.bind(this)(user.data as User);
    data.attributes["permissions"] = await this.app.services.permissions.bind(this)(user.data as User);
    await this.transaction.commit();
    return data;
  }
}
