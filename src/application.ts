import flatten = require("flatten");

import * as Knex from "knex";

import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  Operation,
  OperationResponse,
  ResourceRelationshipData,
  DEFAULT_PRIMARY_KEY,
  ApplicationServices,
  IJsonApiSerializer
} from "./types";
import pick from "./utils/pick";
import unpick from "./utils/unpick";

import ApplicationInstance from "./application-instance";
import JsonApiSerializer from "./serializers/serializer";
import Password from "./attribute-types/password";

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  serializer: IJsonApiSerializer;
  services: ApplicationServices;

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
    this.defaultProcessor = settings.defaultProcessor || OperationProcessor;

    this.serializer = new (settings.serializer || JsonApiSerializer)();
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
    return this.buildOperationResponse(result);
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

  async buildOperationResponse(data: Resource | Resource[] | void): Promise<OperationResponse> {
    const included = flatten(await this.extractIncludedResources(data)).filter(Boolean);
    const uniqueIncluded = [...new Set(included.map((item: Resource) => `${item.type}_${item.id}`))].map(typeId =>
      included.find((item: Resource) => `${item.type}_${item.id}` === typeId)
    );

    const serializedResources = await this.serializeResources(data);

    return included.length ? { included: uniqueIncluded, data: serializedResources } : { data: serializedResources };
  }

  async serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }
    if (Array.isArray(data) && !data.length) {
      return [];
    }

    const dataArrayed = Array.isArray(data) ? data : [data];
    const resource = await this.resourceFor(dataArrayed[0].type);
    return dataArrayed.map(record => this.serializer.serializeResource(record, resource));
  }

  // TODO: remove type any for data.relationships[relationshipName]
  // TODO: improve this function, there's repeated code that I don't like
  async extractIncludedResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }
    if (Array.isArray(data)) {
      return Promise.all(data.map(record => this.extractIncludedResources(record)));
    }

    const schemaRelationships = (await this.resourceFor(data.type)).schema.relationships;
    const includedData: Resource[] = [];
    Object.keys(data.relationships)
      .filter(relationshipName => data.relationships[relationshipName])
      .forEach(relationshipName => {
        if (Array.isArray(data.relationships[relationshipName])) {
          data.relationships[relationshipName] = (data.relationships[relationshipName] as any).map(rel => {
            const relatedResourceClass = schemaRelationships[relationshipName].type();
            const resource = rel[0] || rel;
            const pkName = relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

            if (resource[pkName]) {
              includedData.push(
                this.serializer.serializeResource(
                  new relatedResourceClass({
                    id: resource[pkName],
                    attributes: unpick(resource, [
                      pkName,
                      ...Object.keys(relatedResourceClass.schema.attributes).filter(
                        attribute => relatedResourceClass.schema.attributes[attribute] === Password
                      )
                    ])
                  }),
                  relatedResourceClass
                )
              );
            }

            resource["type"] = relatedResourceClass.type;
            return resource;
          });
        } else {
          const resource = data.relationships[relationshipName];
          const relatedResourceClass = schemaRelationships[relationshipName].type();
          const pkName = relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

          if (resource[pkName]) {
            includedData.push(
              this.serializer.serializeResource(
                new relatedResourceClass({
                  id: resource[pkName],
                  attributes: unpick(resource, [
                    pkName,
                    ...Object.keys(relatedResourceClass.schema.attributes).filter(
                      attribute => relatedResourceClass.schema.attributes[attribute] === Password
                    )
                  ])
                }),
                relatedResourceClass
              )
            );
          }

          resource["type"] = relatedResourceClass.type;
        }
      });

    return includedData;
  }
}
