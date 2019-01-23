import { Context } from "koa";

import Application from "./application";
import { JsonApiDocument, Operation, OperationResponse } from "./types";

export default function jsonApiKoa(app: Application) {
  const URL_REGEX = new RegExp(app.types.map(t => t.name).join("|"), "i");

  return async (ctx: Context, next: Function) => {
    if (ctx.url.match(URL_REGEX) && app.types.length) {
      const ops: Operation[] = convertHttpRequestToOperations(ctx);
      const result: OperationResponse[] = await app.executeOperations(ops);
      ctx.body = convertOperationsResponsesToHttpResponse(ctx, result);
    } else if (ctx.url.match("/bulk")) {
      return {
        operations: await app.executeOperations(
          ctx.request.body.operations || []
        )
      };
    }

    await next();
  };
}

function convertHttpRequestToOperations(ctx: Context) {
  const [, type, id] = ctx.url.split("/");

  if (ctx.method === "GET") {
    return [
      {
        op: "get",
        ref: {
          id,
          type
        }
      } as Operation
    ];
  }

  if (ctx.method === "POST") {
    return [
      {
        op: "add",
        ref: {
          id,
          type
        },
        data: ctx.request.body.data
      } as Operation
    ];
  }

  if (ctx.method === "DELETE") {
    return [
      {
        op: "remove",
        ref: {
          id,
          type
        }
      } as Operation
    ];
  }

  if (ctx.method === "PATCH" || ctx.method === "PUT") {
    return [
      {
        op: "update",
        ref: {
          id,
          type
        },
        data: ctx.request.body.data
      } as Operation
    ];
  }
}

function convertOperationsResponsesToHttpResponse(
  ctx: Context,
  operations: OperationResponse[]
) {
  const responseMethods = ["GET", "POST", "PATCH", "PUT"];

  if (responseMethods.includes(ctx.method)) {
    const { data } = operations[0];
    return { data } as JsonApiDocument;
  }
}
