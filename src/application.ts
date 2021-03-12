import { Knex } from "knex";
import Addon from "./addon";
import ApplicationInstance from "./application-instance";
import { canAccessResource } from "./decorators/authorize";
import KnexProcessor from "./processors/knex-processor";
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import JsonApiSerializer from "./serializers/serializer";
import { AddonOptions, ApplicationAddons, ApplicationServices, IJsonApiSerializer, Operation, OperationResponse, ResourceSchemaRelationship, NoOpTransaction, TransportLayerOptions } from "./types";
import flatten from "./utils/flatten";

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  serializer: IJsonApiSerializer;
  services: ApplicationServices;
  addons: ApplicationAddons;
  transportLayerOptions: TransportLayerOptions;

  constructor(settings: {
    namespace?: string;
    types?: typeof Resource[];
    processors?: typeof OperationProcessor[];
    defaultProcessor?: typeof OperationProcessor;
    serializer?: typeof JsonApiSerializer;
    services?: {};
    transportLayerOptions?: TransportLayerOptions;
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || ({} as ApplicationServices);
    this.defaultProcessor = settings.defaultProcessor || KnexProcessor;
    this.addons = [];
    this.serializer = new (settings.serializer || JsonApiSerializer)();
    this.transportLayerOptions = settings.transportLayerOptions || {
      httpBodyPayload: '1mb'
    };
  }

  use(addon: typeof Addon, options: AddonOptions = {}) {
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
      const result: OperationResponse[] = await Promise.all(
        ops
          .map(async op => {
            const processor = await applicationInstance.processorFor(op.ref.type);

            if (processor) {
              return this.executeOperation(op, processor);
            }
          })
          .filter(Boolean)
      ) as OperationResponse[];

      await applicationInstance.transaction.commit();

      return result;
    } catch (error) {
      await applicationInstance.transaction.rollback(error);
      throw error;
    } finally {
      applicationInstance.transaction = {} as NoOpTransaction;
    }
  }

  async executeOperation(op: Operation, processor: OperationProcessor<Resource>): Promise<OperationResponse> {
    const resourceClass = await this.resourceFor(op.ref.type);

    if (op.ref.relationship) {
      const relationship = resourceClass.schema.relationships[op.ref.relationship];
      const relatedResourceClass = relationship.type();

      if (relatedResourceClass) {
        let relatedOp: Operation = {} as Operation;

        if (relationship.hasMany) {
          const relatedResourceClassRelationships = Object.entries(relatedResourceClass.schema.relationships);
          let [relatedRelationshipName, relatedRelationship]: [string, ResourceSchemaRelationship] =
            relatedResourceClassRelationships.find(([_relName, relData]) => relData.type().type === op.ref.type) as [string, ResourceSchemaRelationship];

          relatedOp = {
            ...op,
            ref: {
              type: relatedResourceClass.type
            },
            params: {
              ...op.params,
              filter: {
                ...(op.params || {}).filter,
                [
                  relatedRelationship.foreignKeyName ||
                  this.serializer.relationshipToColumn(relatedRelationshipName, relatedResourceClass.schema.primaryKeyName)
                ]: op.ref.id
              }
            }
          } as Operation;
        } else if (relationship.belongsTo) {
          const deserializedOriginalOperation = await this.serializer.deserializeResource(
            { ...op, op: "get" },
            resourceClass
          );
          const result = (await processor.execute(deserializedOriginalOperation)) as Resource;

          relatedOp = {
            ...op,
            ref: {
              type: relatedResourceClass.type,
              id: result.attributes[
                resourceClass.schema.relationships[op.ref.relationship].foreignKeyName ||
                this.serializer.relationshipToColumn(op.ref.relationship)
              ] as string
            }
          };
        }

        const deserializedOperation = this.serializer.deserializeResource(relatedOp, relatedResourceClass);
        const relatedProcessor = await this.processorFor(relatedResourceClass.type, processor.appInstance) as OperationProcessor<Resource>;
        const result = await relatedProcessor.execute(deserializedOperation);

        return this.buildOperationResponse(result, processor.appInstance);
      }
    }

    const deserializedOperation = await this.serializer.deserializeResource(op, resourceClass);
    const result = await processor.execute(deserializedOperation);

    return this.buildOperationResponse(result, processor.appInstance);
  }

  async createTransaction(): Promise<Knex.Transaction | NoOpTransaction> {
    const { knex }: { knex?: Knex } = this.services;

    if (!knex) {
      return {
        commit: () => { },
        rollback: () => { }
      }
    }

    return new Promise(resolve =>
      knex.transaction((trx: Knex.Transaction) => {
        resolve(trx);
      })
    );
  }

  async processorFor(
    resourceType: string,
    applicationInstance: ApplicationInstance,
    processorType = this.defaultProcessor
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async processor => ((await processor.shouldHandle(resourceType)) ? processor : false))
    );

    const ProcessorClass = processors.find(p => p !== false);

    if (ProcessorClass) {
      return new ProcessorClass(applicationInstance);
    }

    class ResourceProcessor extends processorType<Resource> {
      static resourceClass = resourceClass;
    }

    return new ResourceProcessor(applicationInstance);
  }

  async resourceFor(resourceType: string): Promise<typeof Resource> {
    return this.types.find(({ type }) => type && type === resourceType) as typeof Resource;
  }

  async buildOperationResponse(
    data: Resource | Resource[] | void,
    appInstance: ApplicationInstance
  ): Promise<OperationResponse> {
    let resourceType: string | null;

    if (Array.isArray(data)) {
      resourceType = data[0] ? data[0].type : null;
    } else if (data) {
      resourceType = data.type;
    } else {
      resourceType = null;
    }

    const allIncluded: Resource[] = !resourceType ? [] : flatten(
      this.serializer.serializeIncludedResources(data, await this.resourceFor(resourceType)) || []
    );

    const included: Resource[] = [];

    await Promise.all(
      allIncluded.map((resource: Resource) => {
        return new Promise<void>(async resolve => {
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

      return data.filter(
        record => !record.preventSerialization
      ).map(
        record => this.serializer.serializeResource(record, resource)
      );
    }

    const resource = await this.resourceFor(data.type);
    return this.serializer.serializeResource(data, resource);
  }
}
