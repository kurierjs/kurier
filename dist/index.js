"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const authorize_1 = require("./decorators/authorize");
exports.Authorize = authorize_1.default;
const decorator_1 = require("./decorators/decorator");
exports.decorateWith = decorator_1.default;
const operation_processor_1 = require("./operation-processor");
exports.OperationProcessor = operation_processor_1.default;
const resource_registry_1 = require("./resource-registry");
exports.ResourceRegistry = resource_registry_1.default;
__export(require("./types"));
