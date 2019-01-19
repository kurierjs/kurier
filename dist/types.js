"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["OK"] = 200] = "OK";
    HttpStatusCode[HttpStatusCode["Created"] = 201] = "Created";
    HttpStatusCode[HttpStatusCode["BadRequest"] = 400] = "BadRequest";
    HttpStatusCode[HttpStatusCode["Unauthorized"] = 401] = "Unauthorized";
    HttpStatusCode[HttpStatusCode["Forbidden"] = 403] = "Forbidden";
    HttpStatusCode[HttpStatusCode["InternalServerError"] = 500] = "InternalServerError";
})(HttpStatusCode = exports.HttpStatusCode || (exports.HttpStatusCode = {}));
var ResourceOperations;
(function (ResourceOperations) {
    ResourceOperations[ResourceOperations["Get"] = 0] = "Get";
    ResourceOperations[ResourceOperations["Add"] = 1] = "Add";
})(ResourceOperations = exports.ResourceOperations || (exports.ResourceOperations = {}));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["UnhandledError"] = "unhandled_error";
    ErrorCode["AccessDenied"] = "access_denied";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
