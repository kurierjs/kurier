import JsonApiErrors from "../json-api-errors";
import { AttributeValueMatch } from "../types";

import decorateWith from "./decorator";

function authorizeMiddleware(operation: Function, conditions: AttributeValueMatch[]) {
  return function() {
    if (!this.appInstance.user) {
      throw JsonApiErrors.Unauthorized();
    }

    if (
      !conditions.every(
        ({ attribute, value }: { attribute: string; value: string | string[] | number | number[] | boolean }) =>
          Array.isArray(value)
            ? value.includes(this.appInstance.user.attributes[attribute])
            : value === this.appInstance.user.attributes[attribute]
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
