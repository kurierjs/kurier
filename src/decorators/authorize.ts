import JsonApiErrors from "../json-api-errors";

import decorateWith from "./decorator";

function authorizeMiddleware(operation: Function) {
  return function() {
    if (!this.app.user) {
      throw JsonApiErrors.AccessDenied();
    }

    return operation.call(this, ...arguments);
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
