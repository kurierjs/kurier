import Application from "./application";
import ApplicationInstance from "./application-instance";
import Authorize from "./decorators/authorize";
import decorateWith from "./decorators/decorator";
import IfUser from "./decorators/if-user";
import JsonApiErrors from "./json-api-errors";
import jsonApiKoa from "./middlewares/json-api-koa";
import jsonApiWebSocket from "./middlewares/json-api-websocket";
import KnexProcessor from "./processors/knex-processor";
import OperationProcessor from "./processors/operation-processor";
import UserProcessor from "./processors/user-processor";
import SessionProcessor from "./processors/session-processor";
import Resource from "./resource";
import User from "./resources/user";
import Session from "./resources/session";
import Password from "./attribute-types/password";
import JsonApiSerializer from "./serializers/serializer";

export {
  // Core objects
  Resource,
  jsonApiKoa,
  jsonApiWebSocket,
  Application,
  ApplicationInstance,
  KnexProcessor,
  JsonApiErrors,
  OperationProcessor,
  JsonApiSerializer,
  // Decorators API
  decorateWith,
  Authorize,
  IfUser,
  // Auth module
  UserProcessor,
  SessionProcessor,
  User,
  Session,
  Password
};

export * from "./types";
export * from "./utils/string";
