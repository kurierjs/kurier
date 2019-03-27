import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import { Operation, OperationResponse, ResourceConstructor } from "./types";

export default class Application {
  public namespace?: string;
  public types: ResourceConstructor[];
  public processors: OperationProcessor[];
  public defaultProcessor: OperationProcessor;
  public user: Resource;

  constructor(settings: {
    namespace?: string;
    types?: ResourceConstructor[];
    processors?: OperationProcessor[];
    defaultProcessor?: OperationProcessor;
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.defaultProcessor =
      settings.defaultProcessor || new OperationProcessor();

    this.defaultProcessor.app = this;
    this.processors.forEach(processor => (processor.app = this));
  }

  async executeOperations(ops: Operation[]): Promise<OperationResponse[]> {
    return await this.createTransaction(
      ops
        .map(async op => {
          const processor = await this.processorFor(op);

          if (processor) {
            return this.executeOperation(op, processor);
          }
        })
        .filter(Boolean)
    );
  }

  async executeOperation(
    op: Operation,
    processor: OperationProcessor
  ): Promise<OperationResponse> {
    const result = await processor.execute(op);
    return this.buildOperationResponse(result);
  }

  async createTransaction(ops: Promise<OperationResponse>[]) {
    return await Promise.all(ops);
  }

  async processorFor(op: Operation): Promise<OperationProcessor | undefined> {
    const processors = await Promise.all(
      this.processors.map(
        async processor => (await processor.shouldHandle(op)) && processor
      )
    );

    const processor = processors.find(Boolean);

    if (processor) {
      return processor;
    }

    if (await this.resourceFor(op.ref.type)) {
      return this.defaultProcessor;
    }
  }

  async resourceFor(
    resourceType: string
  ): Promise<ResourceConstructor | undefined> {
    return this.types.find(({ type }) => type && type === resourceType);
  }

  buildOperationResponse(
    data: Resource | Resource[] | void
  ): OperationResponse {
    return {
      data: data || null
    };
  }
}
