import Application from "./application";
import Authorize from "./decorators/authorize";
import decorateWith from "./decorators/decorator";
import IfUser from "./decorators/if-user";
import JsonApiErrors from "./json-api-errors";
import jsonApiKoa from "./middlewares/json-api-koa";
import KnexProcessor from "./processors/knex-processor";
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";

export {
  // Core objects
  Resource,
  jsonApiKoa,
  Application,
  KnexProcessor,
  JsonApiErrors,
  OperationProcessor,
  // Decorators API
  decorateWith,
  Authorize,
  IfUser
};

export * from "./types";
