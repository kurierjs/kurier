import Resource from "./resource";
import { Operation } from "./types";

export default abstract class OperationProcessor<ResourceT = Resource> {
  execute(op: Operation) {
    const type: string = op.op;

    if (type === "get") {
      return this.get(
        op.ref.type,
        op.ref.id ? { id: op.ref.id } : (op.params && op.params.filter) || {}
      );
    }

    if (type === "remove") {
      return this.remove(op.data);
    }

    if (type === "update") {
      return this.update(op.data);
    }

    if (type === "add") {
      return this.add(op.data);
    }
  }

  protected async get?(type: string, filters: {}): Promise<Resource[]>;

  protected async remove?(data: Resource): Promise<null>;

  protected async update?(data: Resource): Promise<Resource>;

  protected async add?(data: Resource): Promise<Resource>;
}
