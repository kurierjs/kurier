import OperationProcessor from "../operation-processor";
import { Resource } from "../types";
/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `AccessDenied` error code.
 */
export default function authorize(): (target: Function | OperationProcessor<Resource, Resource>, propertyKey?: string, descriptor?: TypedPropertyDescriptor<any>) => any;
