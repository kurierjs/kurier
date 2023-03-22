import * as escapeStringRegexp from "escape-string-regexp";
import { ApplicationInstanceInterface, JsonApiBulkResponse, ResourceLinks, VendorRequest } from "../types";
import JsonApiError from "../errors/error";
import JsonApiErrors from "../errors/json-api-errors";
import User from "../resources/user";
import { JsonApiDocument, JsonApiErrorsDocument, Operation, OperationResponse } from "../types";
import { parse } from "../utils/json-api-params";
import { camelize, singularize, pluralize } from "../utils/string";
import { isEmptyObject } from "./object";
import Resource from "../resource";

const STATUS_MAPPING = {
  GET: 200,
  POST: 201,
  PATCH: 200,
  PUT: 200,
  DELETE: 204,
};

async function authenticate(appInstance: ApplicationInstanceInterface, request: VendorRequest) {
  const authHeader = request.headers.authorization;
  let currentUser: User | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const [, token] = authHeader.split(" ");
    currentUser = await appInstance.getUserFromToken(token);
  }

  appInstance.user = currentUser;
}

function urlData(appInstance: ApplicationInstanceInterface, path: string) {
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
  appInstance: ApplicationInstanceInterface,
  operations: Operation[],
): Promise<JsonApiBulkResponse> {
  return { operations: await appInstance.app.executeOperations(operations || [], appInstance) };
}

async function handleJsonApiEndpoint(
  appInstance: ApplicationInstanceInterface,
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
  const document: JsonApiDocument = {
    data: attachLinksToResources(req, operation)
  };

  if (operation.included) {
    document.included = operation.included;
  }
  
  if (!isEmptyObject(operation.meta!)) {
    document.meta = operation.meta;
  }

  document.links = createLinksForDocument(req);

  return document
}

function buildSelfLinkForResource(req: VendorRequest, resource: Resource): string {
  const urlSegments: string[] = [];

  urlSegments.push(`https://${req.headers.host}`);
  urlSegments.push(pluralize(resource.type));
  urlSegments.push(resource.id as string);

  return urlSegments.join("/");
}

function buildSelfLinkForDocument(req: VendorRequest): string {
  const urlSegments: string[] = [];

  urlSegments.push(`https://${req.headers.host}`);
  urlSegments.push(req.url as string);

  return urlSegments.join("");
}

function attachLinksToResources(req: VendorRequest, operation: OperationResponse): Resource | Resource[] {
  let data: Resource | Resource[];

  if (Array.isArray(operation.data)) {
    data = operation.data.map((resource) => {
      resource.links = {
        self: buildSelfLinkForResource(req, resource),
      };
      return resource;
    });
  } else {
    data = {
      ...operation.data,
      links: {
        self: buildSelfLinkForResource(req, operation.data as Resource),
      },
    } as Resource;
  }

  return data;
}

function createLinksForDocument(req: VendorRequest): ResourceLinks {
  return {
    self: buildSelfLinkForDocument(req),
  };
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
