import { Application, Operation, Resource } from "./types";

export default abstract class OperationProcessor<ResourceT = Resource> {
  constructor(public app: Application) {}

  execute(op: Operation) {
    const type: string = op.ref.type;

    if (type === "get") {
      this.get(op.ref.type, op.ref.id ? { id: op.ref.id } : op.params.filter);
    } else if (type === "remove") {
      this.remove(op.data);
    } else if (type === "update") {
      this.update(op.data);
    } else if (type === "add") {
      this.add(op.data);
    }
  }

  protected async get?(type: string, filters: {}): Promise<Resource[]>;

  protected async remove?(data: Resource | Resource[]): Promise<boolean>;

  protected async update?(
    data: Resource | Resource[]
  ): Promise<Resource | Resource[]>;

  protected async add?(
    data: Resource | Resource[]
  ): Promise<Resource | Resource[]>;
}
