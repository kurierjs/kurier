import Authorize from "./decorators/authorize";
import decorateWith from "./decorators/decorator";
import KnexProcessor from "./knex-processor";
import OperationProcessor from "./operation-processor";
import ResourceRegistry from "./resource-registry";

export {
  // Core objects
  OperationProcessor,
  KnexProcessor,
  ResourceRegistry,
  // Decorators API
  decorateWith,
  Authorize
};

export * from "./types";
