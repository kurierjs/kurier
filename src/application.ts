import OperationProcessor from "./operation-processor";
import Resource from "./resource";
import { Operation, OperationResponse, ResourceConstructor } from "./types";

export default class Application {
  public types: ResourceConstructor[];
  public processors: OperationProcessor[];
  public defaultProcessor: OperationProcessor;

  constructor(settings: {
    types?: ResourceConstructor[];
    processors?: OperationProcessor[];
    defaultProcessor: OperationProcessor;
  }) {
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.defaultProcessor = settings.defaultProcessor;

    this.defaultProcessor.app = this;
    this.processors.forEach(processor => (processor.app = this));
  }

  async executeOperations(ops: Operation[]): Promise<OperationResponse[]> {
    return await Promise.all(
      ops.map(async op => {
        const processor = this.processorFor(op);
        const result = await processor.execute(op);
        return this.buildOperationResponse(result);
      })
    );
  }

  private processorFor(op: Operation): OperationProcessor {
    return this.defaultProcessor;
  }

  private buildOperationResponse(data: Resource | Resource[]) {
    return {
      data
    } as OperationResponse;
  }
}
