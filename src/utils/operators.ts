export type OperatorName = "eq" | "ne" | "lt" | "gt" | "le" | "ge" | "like" | "nlike" | "in" | "nin";

export const KnexOperators = {
  eq: "=",
  ne: "!=",
  lt: "<",
  gt: ">",
  le: "<=",
  ge: ">=",
  like: "like",
  nlike: "not like",
  in: "in",
  nin: "not in",
};

export const FunctionalOperators: { [T in OperatorName]: (actual: any, expected: any) => boolean } = {
  eq: <T = any>(actual: T, expected: T) => actual === expected,
  ne: <T = any>(actual: T, expected: T) => actual !== expected,
  lt: (actual: number, expected: number) => actual < expected,
  gt: (actual: number, expected: number) => actual > expected,
  le: (actual: number, expected: number) => actual <= expected,
  ge: (actual: number, expected: number) => actual >= expected,
  like: (actual: string, expected: string) => {
    if (expected.startsWith("%") && expected.endsWith("%")) {
      return actual.includes(expected.replace(/%/g, ""));
    }

    if (expected.startsWith("%")) {
      return actual.endsWith(expected.replace(/%/g, ""));
    }

    if (expected.endsWith("%")) {
      return actual.startsWith(expected.replace(/%/g, ""));
    }

    return false;
  },
  nlike: (actual: string, expected: string) => {
    if (expected.startsWith("%") && expected.endsWith("%")) {
      return !actual.includes(expected.replace(/%/g, ""));
    }

    if (expected.startsWith("%")) {
      return !actual.endsWith(expected.replace(/%/g, ""));
    }

    if (expected.endsWith("%")) {
      return !actual.startsWith(expected.replace(/%/g, ""));
    }

    return false;
  },
  in: <T = any>(actual: T, expected: T[]) => expected.includes(actual),
  nin: <T = any>(actual: T, expected: T[]) => !expected.includes(actual),
};
