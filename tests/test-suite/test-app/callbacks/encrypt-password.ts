import { Operation } from "../jsonapi-ts";

export default async (op: Operation) => ({ password: op.data.attributes.password });
