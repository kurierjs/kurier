import * as camelize from "camelize";
import { decode } from "jsonwebtoken";
import { Context } from "koa";
import * as koaBodyParser from "koa-bodyparser";
import * as compose from "koa-compose";
import * as pluralize from "pluralize";

import Application from "./application";
import {
  AuthenticatedRequest,
  JsonApiDocument,
  Operation,
  OperationResponse
} from "./types";
import { parse } from "./utils/json-api-params";

export default function jsonApiKoa(app: Application) {
  const URL_REGEX = new RegExp(app.types.map(t => t.name).join("|"), "i");

  const jsonApiKoa = async (ctx: Context, next: () => Promise<any>) => {
    await authenticate(app, ctx);

    if (ctx.path.match(URL_REGEX) && app.types.length) {
      const op: Operation = convertHttpRequestToOperation(ctx);
      const results: OperationResponse[] = await app.executeOperations([op]);
      ctx.body = convertOperationResponseToHttpResponse(ctx, results[0]);
    } else if (ctx.url.match("/bulk")) {
      return {
        operations: await app.executeOperations(
          ctx.request.body.operations || []
        )
      };
    }

    await next();
  };

  return compose([koaBodyParser(), jsonApiKoa]);
}

async function authenticate(app: Application, ctx: Context) {
  const authRequest = ctx.request as AuthenticatedRequest;
  const authHeader = authRequest.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const [, token] = authHeader.split(" ");
    const tokenPayload = decode(token);
    const userId = tokenPayload["id"];

    if (!userId) return;

    const [user] = await app.executeOperations([
      {
        op: "get",
        ref: {
          type: "user",
          id: userId
        }
      } as Operation
    ]);

    app.user = user.data[0];
  }
}

function convertHttpRequestToOperation(ctx: Context): Operation {
  const parts = ctx.path.split("/");
  const type = pluralize.singular(camelize(parts[1].toLowerCase()));
  const id = parts[2] || undefined;

  const opMap = {
    GET: "get",
    POST: "add",
    PATCH: "update",
    PUT: "update",
    DELETE: "remove"
  };

  return {
    op: opMap[ctx.method],
    params: parse(ctx.href),
    ref: { id, type },
    data: ctx.request.body.data
  } as Operation;
}

function convertOperationResponseToHttpResponse(
  ctx: Context,
  operation: OperationResponse
) {
  const responseMethods = ["GET", "POST", "PATCH", "PUT"];

  if (responseMethods.includes(ctx.method)) {
    return { data: operation.data } as JsonApiDocument;
  }
}
