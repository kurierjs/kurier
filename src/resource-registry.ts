import KoaRouter from "koa-router";

import OperationProcessor from "./operation-processor";

type OperationProcessorConstructor = {
  new (): OperationProcessor;
};

export default class ResourceRegistry {
  constructor(private router: KoaRouter) {
    this.router = router;
  }

  // TODO: This should register multiple constructors. Something's wrong
  // with the `resourceName` override in the subclass.
  register(
    resourceName: string,
    operationProcessorConstructor: OperationProcessorConstructor
  ) {
    new operationProcessorConstructor(this.router, resourceName);
    return this;
  }

  // TODO: This should be part of external middlewares (i.e. JSONAPIKoa).
  getEndpoints() {
    return this.router.routes();
  }
}
