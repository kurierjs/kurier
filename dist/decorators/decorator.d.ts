import OperationProcessor from "../operation-processor";
import { OperationDecorator } from "../types";
export declare function getArgument<T>(argsList: any[], match: (arg: any) => boolean): T;
export default function decorateWith(decorator: OperationDecorator, ...decoratorArgs: any[]): (target: Function | OperationProcessor<import("../types").Resource, import("../types").Resource>, propertyKey?: string, descriptor?: TypedPropertyDescriptor<any>) => any;
