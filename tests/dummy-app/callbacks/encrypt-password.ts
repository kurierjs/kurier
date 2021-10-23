import { Operation } from "../kurier";
import hash from "../utils/hash";

export default async (op: Operation) => ({
  password: hash(op.data.attributes.password, process.env.SESSION_KEY),
});
