import { AttributeValueMatch } from "../types";

export function ifUser(attribute: string, value: string | number | boolean | string[] | number[]): AttributeValueMatch {
  return { attribute, value };
}

export function ifUserNotMatches(
  attribute: string,
  value: string | number | boolean | string[] | number[]
): AttributeValueMatch {
  return { attribute, value, operator: "not" };
}

export function ifUserMatchEvery(
  attribute: string,
  value: string | number | boolean | string[] | number[]
): AttributeValueMatch {
  return { attribute, value, operator: "every" };
}
