"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResourceRegistry {
    constructor(router) {
        this.router = router;
        this.router = router;
    }
    // TODO: This should register multiple constructors. Something's wrong
    // with the `resourceName` override in the subclass.
    register(resourceName, operationProcessorConstructor) {
        new operationProcessorConstructor(this.router, resourceName);
        return this;
    }
    // TODO: This should be part of external middlewares (i.e. JSONAPIKoa).
    getEndpoints() {
        return this.router.routes();
    }
}
exports.default = ResourceRegistry;
