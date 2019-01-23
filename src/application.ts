import OperationProcessor from "./operation-processor";
import { Operation, Resource } from "./types";

export default class Application {
  public types: Resource[];
  public processors: OperationProcessor[];
  public defaultProcessor: OperationProcessor;

  constructor(settings: {
    types?: Resource[];
    processors?: OperationProcessor[];
    defaultProcessor: OperationProcessor;
  }) {
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.defaultProcessor = settings.defaultProcessor;
  }

  async executeOperations(ops: Operation[]) {
    return ops.map(async op => {
      const processor = this.processorFor(op);
      return await processor.execute(op);
    });
  }

  private processorFor(op: Operation): OperationProcessor {
    return this.defaultProcessor;
  }
}
