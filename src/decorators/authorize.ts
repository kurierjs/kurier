import OperationProcessor from "../operation-processor";
import { AuthenticatedContext, ErrorCode } from "../types";

import decorateWith, { getArgument } from "./decorator";

function authorizeMiddleware(
  operationProcessor: OperationProcessor,
  operation: Function
) {
  return (...args) => {
    const ctx = getArgument<AuthenticatedContext>(
      args,
      arg => arg.request !== undefined
    );
    if (!ctx.user) {
      throw ErrorCode.AccessDenied;
    }

    return operation.call(operationProcessor, ...args);
  };
}

/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `AccessDenied` error code.
 */
export default function authorize() {
  return decorateWith(authorizeMiddleware);
}
