import * as escapeStringRegexp from "escape-string-regexp";
import { JsonApiBulkResponse, VendorRequest } from "../types";
import ApplicationInstance from "../application-instance";
import JsonApiError from "../errors/error";
import JsonApiErrors from "../errors/json-api-errors";
import User from "../resources/user";
import { JsonApiDocument, JsonApiErrorsDocument, Operation, OperationResponse } from "../types";
import { parse } from "../utils/json-api-params";
import { camelize, singularize } from "../utils/string";
import { isEmptyObject } from "./object";

const STATUS_MAPPING = {
  GET: 200,
  POST: 201,
  PATCH: 200,
  PUT: 200,
  DELETE: 204,
};

async function authenticate(appInstance: ApplicationInstance, request: VendorRequest) {
  const authHeader = request.headers.authorization;
  let currentUser: User | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const [, token] = authHeader.split(" ");
    currentUser = await appInstance.getUserFromToken(token);
  }

  appInstance.user = currentUser;
}

function urlData(appInstance: ApplicationInstance, path: string) {
  const urlRegexp = new RegExp(
    `^(\/+)?((?<namespace>${escapeStringRegexp(
      appInstance.app.namespace,
    )})(\/+|$))?(?<resource>[^\\s\/?]+)?(\/+)?((?<id>[^\\s\/?]+)?(\/+)?(?<relationships>relationships)?(\/+)?)?` +
      "(?<relationship>[^\\s/?]+)?(/+)?$",
  );

  const { resource, id, relationships, relationship } = (path.match(urlRegexp) || {})["groups"] || ({} as any);

  return {
    id,
    resource,
    relationship,
    isRelationships: !!relationships,
  };
}

async function handleBulkEndpoint(
  appInstance: ApplicationInstance,
  operations: Operation[],
): Promise<JsonApiBulkResponse> {
  return { operations: await appInstance.app.executeOperations(operations || [], appInstance) };
}

async function handleJsonApiEndpoint(
  appInstance: ApplicationInstance,
  request: VendorRequest,
): Promise<{ body: JsonApiDocument | JsonApiErrorsDocument; status: number }> {
  const op: Operation = convertHttpRequestToOperation(request);

  try {
    const [result]: OperationResponse[] = await appInstance.app.executeOperations([op], appInstance);
    return {
      body: convertOperationResponseToHttpResponse(request, result),
      status: STATUS_MAPPING[request.method as string],
    } as { body: JsonApiDocument | JsonApiErrorsDocument; status: number };
  } catch (error) {
    return {
      body: convertErrorToHttpResponse(error),
      status: error.status || 500,
    } as { body: JsonApiDocument | JsonApiErrorsDocument; status: number };
  }
}

function convertHttpRequestToOperation(req: VendorRequest): Operation {
  const { id, resource, relationship } = req["urlData"];
  const type = camelize(singularize(resource));

  const opMap = {
    GET: "get",
    POST: "add",
    PATCH: "update",
    PUT: "update",
    DELETE: "remove",
  };

  return {
    op: opMap[req.method as string],
    params: parse(req["href"]),
    ref: { id, type, relationship },
    data: (req.body || {}).data,
  } as Operation;
}

function convertOperationResponseToHttpResponse(
  req: VendorRequest,
  operation: OperationResponse,
): JsonApiDocument | undefined {
  const responseMethods = ["GET", "POST", "PATCH", "PUT"];

  if (responseMethods.includes(req.method as string)) {
    const document = {
      data: operation.data,
    } as JsonApiDocument;
    if (operation.included) {
      document.included = operation.included;
    }
    if (!isEmptyObject(operation.meta!)) {
      document.meta = operation.meta;
    }
    return document;
  }
}

function convertErrorToHttpResponse(error: JsonApiError): JsonApiErrorsDocument {
  const isJsonApiError = error && error.status;
  if (!isJsonApiError) console.error("Kurier: ", error);

  const jsonApiError = isJsonApiError ? error : JsonApiErrors.UnhandledError();
  if ((!process.env.NODE_ENV || process.env.NODE_ENV !== "production") && error.stack && !isJsonApiError) {
    const stackTrace = error.stack.split("\n");
    const [firstLineErrorStack, secondLineErrorStack] = stackTrace;
    const detail = firstLineErrorStack.startsWith("Error:") ? firstLineErrorStack.slice(7) : "";
    jsonApiError.detail = detail;
    jsonApiError.source = {
      pointer: secondLineErrorStack,
    };
  }

  return { errors: [jsonApiError] };
}

export {
  STATUS_MAPPING,
  authenticate,
  urlData,
  handleBulkEndpoint,
  handleJsonApiEndpoint,
  convertHttpRequestToOperation,
  convertOperationResponseToHttpResponse,
  convertErrorToHttpResponse,
};
