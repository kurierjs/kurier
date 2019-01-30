import { HttpStatusCode, JsonApiError } from "./types";

const jsonApiErrors: {
  [key: string]: (args?: {
    [key: string]: string | number | boolean;
  }) => JsonApiError;
} = {
  UnhandledError: (): JsonApiError => ({
    status: HttpStatusCode.InternalServerError,
    code: "unhandled_error"
  }),

  AccessDenied: (): JsonApiError => ({
    status: HttpStatusCode.Forbidden,
    code: "access_denied"
  })
};

export default jsonApiErrors;
