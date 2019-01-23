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
  if (ctx.method === "GET") {
    const [, type, id] = ctx.url.split("/");

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
}

function convertOperationsResponsesToHttpResponse(
  ctx: Context,
  operations: OperationResponse[]
) {
  if (ctx.method === "GET") {
    const { data } = operations[0];
    return { data } as JsonApiDocument;
  }
}
