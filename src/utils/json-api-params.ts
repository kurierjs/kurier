import { URL } from "url";
import { JsonApiParams } from "../types";

const JSON_API_OBJECT_KEYS = ["fields", "filter"];
const JSON_API_ARRAY_VALUES = ["include", "sort", "fields"];

export function parse(url: string): JsonApiParams {
  const params = {};

  const nestedParamRegexp = new RegExp(/(\w+)\[(.*?)\]?$/);

  for (const param of new URL(url).searchParams) {
    const [paramKey, paramValue] = param;

    const nestedParam = nestedParamRegexp.exec(paramKey);

    if (nestedParam) {
      const [, key, nestedKey] = nestedParam;

      if (!(params[key] instanceof Object)) {
        params[key] = {};
      }

      if (paramValue !== "") {
        params[key][nestedKey] = parseValueForKey(key, paramValue);
      }
    } else {
      if (paramValue !== "") {
        const value = parseValueForKey(paramKey, paramValue);

        params[paramKey] = JSON_API_OBJECT_KEYS.includes(paramKey) ? { ...(value as any) } : value;
      }
    }
  }

  return params;
}

function parseValueForKey(key: string, value = "") {
  if (JSON_API_ARRAY_VALUES.includes(key)) {
    return value.split(",");
  }

  return value;
}
