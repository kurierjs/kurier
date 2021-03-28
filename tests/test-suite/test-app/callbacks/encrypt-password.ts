import { Operation } from "../kurier";

export default async (op: Operation) => ({ password: op.data.attributes.password });
