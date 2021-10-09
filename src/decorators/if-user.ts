import { AttributeValueMatch } from "../types";

export function ifUser(attribute: string, value: string | number | boolean | string[] | number[]): AttributeValueMatch {
  return { attribute, value };
}

export function ifUserDoesNotMatches(
  attribute: string,
  value: string | number | boolean | string[] | number[],
): AttributeValueMatch {
  return { attribute, value, operator: "not" };
}

export function ifUserMatchesEvery(
  attribute: string,
  value: string | number | boolean | string[] | number[],
): AttributeValueMatch {
  return { attribute, value, operator: "every" };
}

export function ifUserHasRole(value: string | string[]): AttributeValueMatch {
  return ifUser("roles", value);
}

export function ifUserHasEveryRole(value: string[]): AttributeValueMatch {
  return ifUserMatchesEvery("roles", value);
}

export function ifUserDoesNotHaveRole(value: string | string[]): AttributeValueMatch {
  return ifUserDoesNotMatches("roles", value);
}

export function ifUserHasPermission(value: string | string[]): AttributeValueMatch {
  return ifUser("permissions", value);
}

export function ifUserHasEveryPermission(value: string[]): AttributeValueMatch {
  return ifUserMatchesEvery("permissions", value);
}

export function ifUserDoesNotHavePermission(value: string | string[]): AttributeValueMatch {
  return ifUserDoesNotMatches("permissions", value);
}
