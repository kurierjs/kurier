"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const decorator_1 = require("./decorator");
function authorizeMiddleware(operationProcessor, operation) {
    return (...args) => {
        const ctx = decorator_1.getArgument(args, arg => arg.request !== undefined);
        if (!ctx.user) {
            throw types_1.ErrorCode.AccessDenied;
        }
        return operation.call(operationProcessor, ...args);
    };
}
/**
 * This decorator is responsible of checking if there's a user in the API's
 * context object. If there is, it'll allow the operation to continue.
 * If not, it'll throw an `AccessDenied` error code.
 */
function authorize() {
    return decorator_1.default(authorizeMiddleware);
}
exports.default = authorize;
