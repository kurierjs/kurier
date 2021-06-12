import { IJsonApiSerializer, KnexRecord } from ".";
import { HttpStatusCode, Links, Meta } from "./types";

export interface IOperationResultOptions {
  meta?: Meta;
  links?: Links;
}

export abstract class OperationResult {
  code: HttpStatusCode;
  meta: Meta;
  links: Links;
  options: any;

  constructor(code: HttpStatusCode, options: IOperationResultOptions = {}) {
    this.code = code;
    this.options = options;
    this.meta = options.meta || {};
    this.links = options.links || {};
  }

  toPOJO(serializer: IJsonApiSerializer | undefined) {
    return {};
  }
}

export interface IResourcesOperationResultOptions extends IOperationResultOptions {
  paginationParams?: any;
  recordCount?: number;
  pageCount?: number;
}

export class ResourcesOperationResult extends OperationResult {
  resources: Array<KnexRecord>;
  paginationParams: any;
  recordCount?: number;
  pageCount?: number;

  constructor(code: HttpStatusCode, resources: Array<KnexRecord>, options: IResourcesOperationResultOptions = {}) {
    super(code, options);

    this.resources = resources;
    this.paginationParams = options.paginationParams || {};
    this.recordCount = options.recordCount;
    this.pageCount = options.pageCount;
  }
}
