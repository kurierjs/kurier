import { HttpStatusCode } from "../types";
import JsonApiError from "./error";

export default {
  UnhandledError: () => new JsonApiError(HttpStatusCode.InternalServerError, "unhandled_error"),
  AccessDenied: () => new JsonApiError(HttpStatusCode.Forbidden, "access_denied"),
  Unauthorized: () => new JsonApiError(HttpStatusCode.Unauthorized, "unauthorized"),
  RecordNotExists: () => new JsonApiError(HttpStatusCode.NotFound, "not_found"),
  InvalidToken: () => new JsonApiError(HttpStatusCode.UnprocessableEntity, "invalid_token"),
  InvalidData: () => new JsonApiError(HttpStatusCode.UnprocessableEntity, "invalid_data"),
  BadRequest: () => new JsonApiError(HttpStatusCode.BadRequest, "bad_request")
};
