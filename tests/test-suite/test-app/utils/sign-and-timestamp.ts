import { Operation, Resource } from "../jsonapi-ts";
import User from "../resources/user";

export default function signAndTimestampOperation(op: Operation, resourceType: typeof Resource, user: User) {
  if (op.op === "add") {
    if ("createdBy" in resourceType.schema.attributes) {
      op.data.attributes.createdBy = user.id;
    }

    if ("createdOn" in resourceType.schema.attributes) {
      op.data.attributes.createdOn = new Date().toJSON();
    }
  }

  if (op.op === "update") {
    if ("updatedBy" in resourceType.schema.attributes) {
      op.data.attributes.updatedBy = user.id;
    }

    if ("updatedOn" in resourceType.schema.attributes) {
      op.data.attributes.updatedOn = new Date().toJSON();
    }
  }

  return op;
}
