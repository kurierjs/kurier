import JsonApiErrors from "../errors/json-api-errors";
import { AttributeValueMatch, AttributeValue } from "../types";

import decorateWith from "./decorator";
import OperationProcessor from "../processors/operation-processor";
import { Resource } from "..";

type PrimitiveValue = string | number | boolean | object;

const match = (actual: AttributeValue) => (item: PrimitiveValue) => (actual as any[]).includes(item);

function authorizeMiddleware(operation: Function, conditions: AttributeValueMatch[]) {
  return function(this: OperationProcessor<Resource>) {
    if (!this.appInstance.user) {
      throw JsonApiErrors.Unauthorized();
    }

    if (
      !conditions.every(({ attribute, value, operator = "some" }: AttributeValueMatch) => {
        const actual: AttributeValue = this.appInstance.user.attributes[attribute];
        const expected = value;

        if (Array.isArray(actual)) {
          if (Array.isArray(expected)) {
            if (operator === "some") {
              return expected.some(match(actual));
            }

            if (operator === "every") {
              return expected.every(match(actual));
            }

            if (operator === "not") {
              return !expected.every(match(actual));
            }
          }

          if (operator === "not") {
            return !match(actual)(expected);
          }

          return match(actual)(expected);
        }

        if (Array.isArray(expected)) {
          return match(expected)(actual);
        }

        if (operator === "not") {
          return actual !== expected;
        }

        return actual === expected;
      })
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
