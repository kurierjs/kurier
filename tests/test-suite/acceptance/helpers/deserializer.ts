import app from "../../test-app/app";
import { Operation, Resource } from "../../../../src";

export default function deserializer(
  data: Resource,
  resourceClass: typeof Resource,
  operationType: string = "add"
): Operation {
  const baseData = { data, op: operationType, ref: { type: resourceClass.type } };
  return app.serializer.deserializeResource(baseData, resourceClass);
}
