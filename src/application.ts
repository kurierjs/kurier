import * as Knex from "knex";

import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  Operation,
  OperationResponse,
  ApplicationServices,
  IJsonApiSerializer,
  ApplicationAddons,
  AddonOptions
} from "./types";
import flatten from "./utils/flatten";

import ApplicationInstance from "./application-instance";
import JsonApiSerializer from "./serializers/serializer";
import Addon from "./addon";
import { canAccessResource } from "./decorators/authorize";
import KnexProcessor from "./processors/knex-processor";

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  serializer: IJsonApiSerializer;
  services: ApplicationServices;
  addons: ApplicationAddons;

  constructor(settings: {
    namespace?: string;
    types?: typeof Resource[];
    processors?: typeof OperationProcessor[];
    defaultProcessor?: typeof OperationProcessor;
    serializer?: typeof JsonApiSerializer;
    services?: {};
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || ({} as ApplicationServices);
    this.defaultProcessor = settings.defaultProcessor || KnexProcessor;
    this.addons = [];
    this.serializer = new (settings.serializer || JsonApiSerializer)();
  }

  use(addon: typeof Addon, options?: AddonOptions) {
    if (this.addons.find(installedAddon => installedAddon.addon === addon)) {
      return;
    }

    new addon(this, options).install().then(() => {
      this.addons.push({ addon, options });
    });
  }

  async executeOperations(
    ops: Operation[],
    applicationInstance = new ApplicationInstance(this)
  ): Promise<OperationResponse[]> {
    applicationInstance.transaction = await this.createTransaction();

    try {
      const result = await Promise.all(
        ops
          .map(async op => {
            const processor = await applicationInstance.processorFor(op.ref.type);

            if (processor) {
              return this.executeOperation(op, processor);
            }
          })
          .filter(Boolean)
      );

      await applicationInstance.transaction.commit();

      return result;
    } catch (error) {
      await applicationInstance.transaction.rollback(error);
      throw error;
    } finally {
      applicationInstance.transaction = null;
    }
  }

  async executeOperation(op: Operation, processor: OperationProcessor<Resource>): Promise<OperationResponse> {
    const resourceClass = await this.resourceFor(op.ref.type);
    const deserializedOperation = await this.serializer.deserializeResource(op, resourceClass);
    const result = await processor.execute(deserializedOperation);

    return this.buildOperationResponse(result, processor.appInstance);
  }

  async createTransaction(): Promise<Knex.Transaction | undefined> {
    const { knex }: { knex?: Knex } = this.services;

    if (!knex) {
      return;
    }

    return new Promise(resolve =>
      knex.transaction((trx: Knex.Transaction) => {
        resolve(trx);
      })
    );
  }

  async processorFor(
    resourceType: string,
    applicationInstance: ApplicationInstance
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async processor => ((await processor.shouldHandle(resourceType)) ? processor : false))
    );

    // tslint:disable-next-line
    const ProcessorClass = processors.find(p => p !== false);

    if (ProcessorClass) {
      return new ProcessorClass(applicationInstance);
    }

    class ResourceProcessor extends this.defaultProcessor<Resource> {
      static resourceClass = resourceClass;
    }

    return new ResourceProcessor(applicationInstance);
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    return this.types.find(({ type }) => type && type === resourceType);
  }

  async buildOperationResponse(
    data: Resource | Resource[] | void,
    appInstance: ApplicationInstance
  ): Promise<OperationResponse> {
    let resourceType: string;

    if (Array.isArray(data)) {
      resourceType = data[0] ? data[0].type : null;
    } else if (data) {
      resourceType = data.type;
    } else {
      resourceType = null;
    }

    const allIncluded = flatten(
      await this.serializer.serializeIncludedResources(data, await this.resourceFor(resourceType))
    );

    const included = [];

    await Promise.all(
      allIncluded.map((resource: Resource) => {
        return new Promise(async resolve => {
          const result = await canAccessResource(resource, "get", appInstance);

          if (result) {
            included.push(resource);
          }

          resolve();
        });
      })
    );

    const serializedResources = await this.serializeResources(data);

    return included.length ? { included, data: serializedResources } : { data: serializedResources };
  }

  async serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      if (!data.length) {
        return [];
      }

      const resource = await this.resourceFor(data[0].type);

      return data.map(record => this.serializer.serializeResource(record, resource));
    }

    const resource = await this.resourceFor(data.type);
    return this.serializer.serializeResource(data, resource);
  }
}
