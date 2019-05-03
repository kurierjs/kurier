import { Operation, Resource } from "../jsonapi-ts";
import User from "../resources/user";

export default function signAndTimestampOperation(
  op: Operation,
  resourceType: typeof Resource,
  user: User
) {
  if (op.op === "add") {
    if ("created_by" in resourceType.schema.attributes) {
      op.data.attributes.created_by = user.id;
    }

    if ("created_on" in resourceType.schema.attributes) {
      op.data.attributes.created_on = new Date().toJSON();
    }
  }

  if (op.op === "update") {
    if ("updated_by" in resourceType.schema.attributes) {
      op.data.attributes.updated_by = user.id;
    }

    if ("updated_on" in resourceType.schema.attributes) {
      op.data.attributes.updated_on = new Date().toJSON();
    }
  }

  return op;
}
