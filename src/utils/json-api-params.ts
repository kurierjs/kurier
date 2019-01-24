import { JsonApiParams } from "../types";

export function parse(url: string): JsonApiParams {
  const params = {};

  const nestedParamRegexp = new RegExp(/(\w+)\[(.*?)\]?$/);
  const arrayParamRegexp = new RegExp(/\w+,(\w+,?)*/);

  for (const param of new URL(url).searchParams) {
    const [paramKey, paramValue] = param;
    const nestedParam = nestedParamRegexp.exec(paramKey);
    let value: string | string[] = paramValue;

    if (arrayParamRegexp.test(paramValue)) {
      value = value.split(",");
    }

    if (nestedParam) {
      const [, key, nestedKey] = nestedParam;

      if (!(params[key] instanceof Object)) {
        params[key] = {};
      }

      if (value !== "") {
        params[key][nestedKey] = value;
      }
    } else {
      if (value !== "") {
        params[paramKey] = value;
      }
    }
  }

  return params;
}
