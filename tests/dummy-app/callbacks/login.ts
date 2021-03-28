import { Operation, ResourceAttributes } from "../kurier";
import hash from "../utils/hash";

export default async (op: Operation, user: ResourceAttributes) => {
  return (
    op.data.attributes.email === user.email &&
    hash(op.data.attributes.password, process.env.SESSION_KEY) === user.password
  );
};
