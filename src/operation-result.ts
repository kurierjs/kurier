import { IJsonApiSerializer, KnexRecord } from ".";
import Resource from "./resource";
import { HttpStatusCode, Links, Meta } from "./types";

export interface IOperationResultOptions {
  meta?: Meta;
  links?: Links;
}

export abstract class OperationResult {
  code: HttpStatusCode;
  meta: Meta;
  links: Links;

  constructor(code: HttpStatusCode, options: IOperationResultOptions = {}) {
    this.code = code;
    this.meta = options.meta || {};
    this.links = options.links || {};
  }

  toPOJO(serializer: IJsonApiSerializer | undefined) {
    return {};
  }
}

export interface IResourcesOperationResultOptions extends IOperationResultOptions {
  recordCount?: number;
}

export class ResourcesOperationResult<TResource extends Resource = Resource> extends OperationResult {
  records: Array<KnexRecord>;
  recordCount?: number;
  resources?: Array<TResource>;

  constructor(code: HttpStatusCode, records: Array<KnexRecord>, options: IResourcesOperationResultOptions = {}) {
    super(code, options);

    this.records = records;
    this.recordCount = options.recordCount;
  }
}
