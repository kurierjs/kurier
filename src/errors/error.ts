import { HttpStatusCode, IJsonApiError } from "../types";

export default class JsonApiError extends Error implements IJsonApiError {
  public id?: string;
  public status: HttpStatusCode;
  public code: string;
  public title?: string;
  public detail?: string;
  public source?: {
    pointer?: string;
    parameter?: string;
  };
  public links?: {
    about?: string;
  };

  constructor(status: HttpStatusCode, code: string, detail?: string) {
    super(`${status}: ${code}`);

    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}
