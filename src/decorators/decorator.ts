import OperationProcessor from "../processors/operation-processor";
import { OperationDecorator } from "../types";

// TODO: should this filter be decorator-based to prevent name constraints?
function isOperation(name: string) {
  return ["get", "add", "update", "remove"].includes(name);
}

export function getArgument<T>(argsList: any[], match: (arg: any) => boolean) {
  return argsList.find(arg => arg && match(arg)) as T;
}

export default function decorateWith(decorator: OperationDecorator, ...decoratorArgs: any[]) {
  return (
    target: OperationProcessor<any> | Function,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<any>
  ): any => {
    if (propertyKey && descriptor) {
      // Behave as a method decorator. Only apply where requested.
      const originalFunction = descriptor.value;

      descriptor.value = decorator(originalFunction, ...decoratorArgs);
    } else {
      // Behave as a class decorator. Apply to all.
      const controller = target as Function;
      const controllerMethods = Object.getOwnPropertyNames(controller.prototype)
        .filter(isOperation)
        .map(member => ({
          methodName: member,
          descriptor: Object.getOwnPropertyDescriptor(controller.prototype, member) as PropertyDescriptor
        }));

      controllerMethods.forEach(controllerMethod => {
        const originalFunction = controllerMethod.descriptor.value;

        Object.defineProperty(controller.prototype, controllerMethod.methodName, {
          ...controllerMethod.descriptor,
          value: decorator(originalFunction, ...decoratorArgs)
        });
      });
    }
  };
}
