import { IncomingMessage, ServerResponse } from "http";
import { Knex } from "knex";
import { Request as ExpressRequest } from "express";
import { Request as KoaRequest } from "koa";
import Addon from "./addon";
import ApplicationInstance from "./application-instance";
import Password from "./attribute-types/password";
import Resource from "./resource";
import User from "./resources/user";
import Application from "./application";

declare module "express" {
  interface Request {
    href: string;
    urlData: UrlData;
  }
}

declare module "koa" {
  interface Request {
    urlData: UrlData;
  }
}

export type UrlData = {
  id: string;
  resource: string;
  relationship: string;
  isRelationships: boolean;
};

export enum HttpStatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  UnprocessableEntity = 422,
  InternalServerError = 500,
}

export const DEFAULT_PRIMARY_KEY = "id";

export type OperationDecorator = (
  operationCallback: Function,
  ...middlewareArguments: any[]
) => (...args: any[]) => any;

// Generic types for JSONAPI document structure.

export type AttributeValue = string | number | boolean | string[] | number[] | boolean[] | object | object[];

export type ResourceAttributes = {
  [key: string]: AttributeValue;
};

export type ResourceRelationships = {
  [key: string]: ResourceRelationship;
};

export type ResourceRelationship = {
  meta?: Meta;
  links?: Links;
  data?: ResourceRelationshipData | ResourceRelationshipData[];
};

export type ResourceRelationshipData = {
  type: string;
  id: string;
};

export type Meta = {
  [key: string]: AttributeValue;
};

export type MaybeMeta = Meta | void;

export type JsonApiDocument<ResourceT = Resource, RelatedResourcesT = Resource> = {
  data: ResourceT | ResourceT[];
  meta?: Meta;
  operations?: Operation[];
  included?: RelatedResourcesT[];
};

export type JsonApiErrorsDocument = {
  errors: IJsonApiError[];
  meta?: Meta;
};

export interface IJsonApiError {
  id?: string;
  status: HttpStatusCode;
  code: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  links?: {
    about?: string;
  };
}

export type JsonApiParams = {
  include?: string[];
  sort?: string[];
  filter?: { [key: string]: string };
  page?: { [key: string]: number };
  fields?: { [key: string]: string[] };
};

export type Links = {
  self: string | Link;
  related?: string | Link;
};

export type Link = {
  href: string;
  meta?: Meta;
};

export type Operation = {
  op: string;
  data?: Resource;
  included?: Resource[];
  ref: {
    type: string;
    id?: string | undefined;
    lid?: string;
    relationship?: string;
  };
  params?: JsonApiParams;
  links?: Links;
  meta?: Meta;
};

export type OperationResponse = {
  data: Resource | Resource[] | null;
  included?: Resource[];
  meta?: Meta;
};

export type KnexRecord = {
  id: string;
  [key: string]: any;
};

export type AttributeValueMatch = {
  attribute: string;
  value: AttributeValue;
  operator?: "not" | "some" | "every";
};

export interface ResourceSchema {
  primaryKeyName?: string;
  attributes: ResourceSchemaAttributes;
  relationships: ResourceSchemaRelationships;
}

export type PasswordConstructor = typeof Password;

export type NativeConstructorType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;

export interface ResourceSchemaAttributes {
  [key: string]: NativeConstructorType | PasswordConstructor;
}

export type ResourceSchemaRelationships = {
  [key: string]: ResourceSchemaRelationship;
};

export interface ResourceSchemaRelationship {
  type: () => typeof Resource;
  hasMany?: boolean;
  belongsTo?: boolean;
  foreignKeyName?: string;
}

export type HasManyResourceSchemaRelationship = ResourceSchemaRelationship & {
  hasMany: true;
};

export type BelongsToResourceSchemaRelationship = ResourceSchemaRelationship & {
  belongsTo: true;
};

export type ResourceSchemaRelationshipOptions = Omit<ResourceSchemaRelationship, "type" | "hasMany" | "belongsTo">;

export interface HasId {
  id: any;
  [key: string]: any;
}

export type EagerLoadedData = {
  [key: string]: ResourceRelationshipDescriptor;
};

export type ResourceRelationshipDescriptor = {
  direct: KnexRecord[] | undefined;
  nested: KnexRecord[] | undefined;
};

export type ApplicationServices = {
  knex?: Knex;
  roles?: (this: ApplicationInstance, user: User) => Promise<string[]>;
  permissions?: (this: ApplicationInstance, user: User) => Promise<string[]>;
} & { [key: string]: any };

export interface IJsonApiSerializer {
  attributeTypes: ApplicationAttributeTypes;
  registerAttributeType(attributeDefinition: ApplicationAttributeTypeFactory): void;
  isSensitiveAttribute(resourceSchema: ResourceSchema, attributeName: string): boolean;
  resourceTypeToTableName(resourceType: string): string;
  attributeToColumn(attributeName: string): string;
  columnToAttribute(columnName: string): string;
  relationshipToColumn(relationshipName: string, primaryKeyName?: string): string;
  columnToRelationship(columnName: string, primaryKeyName?: string): string;
  foreignResourceToForeignTableName(foreignResourceType: string, prefix?: string): string;
  deserializeResource(op: Operation, resourceClass: typeof Resource): Operation;
  serializeResource(resource: Resource, resourceType: typeof Resource): Resource;
  serializeRelationship(
    relationships: Resource | Resource[],
    resourceType: typeof Resource,
    primaryKeyName?: string,
  ): ResourceRelationshipData[];
  serializeIncludedResources(data: Resource | Resource[] | void, resourceType: typeof Resource): Resource[] | null;
}

export interface IAddon {
  install(): Promise<void>;
}
export type AddonOptions = { [key: string]: any };
export type ApplicationAddons = { addon: typeof Addon; options: AddonOptions }[];

export type NoOpTransaction = {
  commit(): void;
  rollback(): void;
};

export type TransportLayerOptions = {
  httpBodyPayload?: string;
  httpStrictMode?: boolean;
};

export type VercelRequest<BodyType = JsonApiDocument> = IncomingMessage & {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body: BodyType;

  // Custom extensions made by Kurier.
  href: string;
  urlData: UrlData;
};

export type VercelResponse = ServerResponse & {
  status: (code: HttpStatusCode) => void;
  send: (body: string | JsonApiDocument | JsonApiErrorsDocument | JsonApiBulkResponse | Buffer) => void;
  json: (body: JsonApiDocument | JsonApiErrorsDocument | JsonApiBulkResponse) => void;
  redirect: (urlOrStatusCode: HttpStatusCode | string, url?: string) => void;
};

export type JsonApiBulkResponse = { operations: OperationResponse[] };

export type VendorRequest = ExpressRequest | KoaRequest | VercelRequest;

export type HookFunction = (appInstance: ApplicationInstance, parameters?: Record<string, any>) => Promise<void>;

export interface ApplicationHooks {
  beforeAuthentication: HookFunction[];
  afterOpCreated: HookFunction[];
  beforeRequestHandling: HookFunction[];
  beforeResponse: HookFunction[];
  beforeExecutingIdentifyOperation: HookFunction[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationInterface extends Application {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationInstanceInterface extends ApplicationInstance {}

export type ApplicationAttributeTypeOptions<StoredType, JsonType = StoredType> = {
  isSensitive?: boolean;
  jsonType: NativeConstructorType;
  serialize?(value: StoredType): JsonType;
  deserialize?(value: JsonType): StoredType;
};

export type ApplicationAttributeTypeFactory = new () => ApplicationAttributeInstantiatedTypeClass;
export type ApplicationAttributeInstantiatedTypeClass = Omit<ApplicationAttributeTypeOptions<any>, "jsonType"> & {
  isSensitive: boolean;
};

export interface ApplicationAttributeType {
  name: string;
  definition: ApplicationAttributeInstantiatedTypeClass;
}

export type ApplicationAttributeTypes = ApplicationAttributeType[];
