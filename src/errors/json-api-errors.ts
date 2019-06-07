import { HttpStatusCode } from "../types";
import JsonApiError from "./error";

export default {
  UnhandledError: (detail?: string) => new JsonApiError(HttpStatusCode.InternalServerError, "unhandled_error", detail),
  AccessDenied: (detail?: string) => new JsonApiError(HttpStatusCode.Forbidden, "access_denied", detail),
  Unauthorized: (detail?: string) => new JsonApiError(HttpStatusCode.Unauthorized, "unauthorized", detail),
  RecordNotExists: (detail?: string) => new JsonApiError(HttpStatusCode.NotFound, "not_found", detail),
  InvalidToken: (detail?: string) => new JsonApiError(HttpStatusCode.UnprocessableEntity, "invalid_token", detail),
  InvalidData: (detail?: string) => new JsonApiError(HttpStatusCode.UnprocessableEntity, "invalid_data", detail),
  BadRequest: (detail?: string) => new JsonApiError(HttpStatusCode.BadRequest, "bad_request", detail)
};
