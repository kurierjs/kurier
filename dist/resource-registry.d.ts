/// <reference types="koa" />
/// <reference types="koa-compose" />
import KoaRouter from "koa-router";
import OperationProcessor from "./operation-processor";
declare type OperationProcessorConstructor = {
    new (router: KoaRouter, resourceName: string): OperationProcessor;
};
export default class ResourceRegistry {
    private router;
    constructor(router: KoaRouter);
    register(resourceName: string, operationProcessorConstructor: OperationProcessorConstructor): this;
    getEndpoints(): import("koa-compose").Middleware<import("koa").ParameterizedContext<any, KoaRouter.IRouterParamContext<any, {}>>>;
}
export {};
