import { Operation, ResourceAttributes } from "../kurier";

export default async (op: Operation, user: ResourceAttributes) => {
  return op.data.attributes.email === user.email && op.data.attributes.password === user.password;
}
