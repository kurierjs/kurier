import JsonApiErrors from "../json-api-errors";
import { AttributeValueMatch } from "../types";

import decorateWith from "./decorator";

function authorizeMiddleware(
  operation: Function,
  conditions: AttributeValueMatch[]
) {
  return function() {
    if (!this.app.user) {
      throw JsonApiErrors.Unauthorized();
    }

    if (
      !conditions.every(
        ({ attribute, value }) => this.app.user[attribute] === value
      )
    ) {
      throw JsonApiErrors.AccessDenied();
    }

    return operation.call(this, ...arguments);
  };
}

/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `Unauthorized` error code.
 */
export default function authorize(...conditions: AttributeValueMatch[]) {
  return decorateWith(authorizeMiddleware, conditions);
}
