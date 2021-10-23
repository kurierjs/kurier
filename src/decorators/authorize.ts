import JsonApiErrors from "../errors/json-api-errors";
import { AttributeValueMatch, AttributeValue } from "../types";

import decorateWith from "./decorator";
import OperationProcessor from "../processors/operation-processor";
import Resource from "../resource";
import ApplicationInstance from "../application-instance";

type PrimitiveValue = string | number | boolean | object;

const match = (actual: AttributeValue) => (item: PrimitiveValue) => (actual as any[]).includes(item);
const ACCESS_RULES = Symbol("accessRules");

// This is a replacement function for Array.every().
// For some odd reason, there are type conflicts with AttributeValue
// starting with TypeScript >= 4.x.
const every = (expected: AttributeValue[], actual: AttributeValue) => {
  for (let index = 0; index < expected.length; index += 1) {
    if (!match(actual)(expected[index])) {
      return false;
    }
  }

  return true;
};

function conditionsPass(
  appInstance: ApplicationInstance,
  { attribute, value, operator = "some" }: AttributeValueMatch,
) {
  const actual: AttributeValue = appInstance.user?.attributes[attribute] as AttributeValue;
  const expected = value;

  if (Array.isArray(actual)) {
    if (Array.isArray(expected)) {
      if (operator === "some") {
        return expected.some(match(actual));
      }

      if (operator === "every") {
        return every(expected, actual);
      }

      if (operator === "not") {
        return !every(expected, actual);
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
}

function authorizeMiddleware(operation: Function, conditions: AttributeValueMatch[]) {
  const callback = function (this: OperationProcessor<Resource>) {
    if (!this.appInstance.user) {
      throw JsonApiErrors.Unauthorized();
    }

    if (!conditions.every((condition: AttributeValueMatch) => conditionsPass(this.appInstance, condition))) {
      throw JsonApiErrors.AccessDenied();
    }

    return operation.call(this, ...arguments);
  };

  callback[ACCESS_RULES] = conditions;

  return callback;
}

/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `Unauthorized` error code.
 */
export default function authorize(...conditions: AttributeValueMatch[]) {
  return decorateWith(authorizeMiddleware, conditions);
}

export async function canAccessResource(
  resource: Resource | Resource[],
  operationName: string,
  appInstance: ApplicationInstance,
) {
  const type = Array.isArray(resource) && resource.length ? resource[0].type : (resource as Resource).type;
  const processor = (await appInstance.processorFor(type)) as OperationProcessor<Resource>;
  const accessRules = processor[operationName][ACCESS_RULES] || [];

  if (!accessRules.length) {
    return true;
  }

  if (!appInstance.user) {
    return false;
  }

  return accessRules.every((condition: AttributeValueMatch) => conditionsPass(appInstance, condition));
}
