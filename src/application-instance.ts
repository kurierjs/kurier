import Application from "./application";
import Resource from "./resource";
import { OperationProcessor } from ".";

export default class ApplicationInstance {
  public user: typeof Resource;

  constructor(public app: Application) {}

  async processorFor(
    resourceType: string
  ): Promise<OperationProcessor<Resource> | undefined> {
    return this.app.processorFor(resourceType, this);
  }
}
