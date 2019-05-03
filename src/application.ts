import flatten = require("flatten");

import * as Knex from "knex";

import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  Operation,
  OperationResponse,
  ResourceRelationshipData,
  DEFAULT_PRIMARY_KEY
} from "./types";
import pick from "./utils/pick";
import unpick from "./utils/unpick";
import ApplicationInstance from "./application-instance";

export default class Application {
  namespace: string;
  types: typeof Resource[];
  processors: typeof OperationProcessor[];
  defaultProcessor: typeof OperationProcessor;
  user: Resource;
  services: { [key: string]: any };

  constructor(settings: {
    namespace?: string;
    types?: typeof Resource[];
    processors?: typeof OperationProcessor[];
    defaultProcessor?: typeof OperationProcessor;
    services?: {};
  }) {
    this.namespace = settings.namespace || "";
    this.types = settings.types || [];
    this.processors = settings.processors || [];
    this.services = settings.services || {};
    this.defaultProcessor = settings.defaultProcessor || OperationProcessor;
  }

  async executeOperations(ops: Operation[]): Promise<OperationResponse[]> {
    const applicationInstance = new ApplicationInstance(this);

    applicationInstance.transaction = await this.createTransaction();

    console.log("TRANSACTION: ", applicationInstance.transaction);

    try {
      const result = await Promise.all(
        ops
          .map(async op => {
            const processor = await applicationInstance.processorFor(
              op.ref.type
            );

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
    } finally {
      applicationInstance.transaction = null;
    }
  }

  async executeOperation(
    op: Operation,
    processor: OperationProcessor<Resource>
  ): Promise<OperationResponse> {
    const result = await processor.execute(await this.deserializeResource(op));
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

  async deserializeResource(op: Operation) {
    if (!op.data || !op.data.attributes) {
      return op;
    }

    const resourceClass = await this.resourceFor(op.ref.type);
    const schemaRelationships = resourceClass.schema.relationships;
    op.data.attributes = Object.keys(schemaRelationships)
      .filter(
        relName =>
          schemaRelationships[relName].belongsTo &&
          op.data.relationships &&
          op.data.relationships.hasOwnProperty(relName)
      )
      .reduce((relationAttributes, relName) => {
        const key =
          schemaRelationships[relName].foreignKeyName || `${relName}Id`;
        const value = (<ResourceRelationshipData>(
          op.data.relationships[relName].data
        )).id;

        return {
          ...relationAttributes,
          [key]: value
        };
      }, op.data.attributes);
    return op;
  }

  async processorFor(
    resourceType: string,
    applicationInstance: ApplicationInstance
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async processor =>
        (await processor.shouldHandle(resourceType)) ? processor : false
      )
    );

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
    data: Resource | Resource[] | void
  ): Promise<OperationResponse> {
    const included = flatten(await this.extractIncludedResources(data)).filter(
      Boolean
    );
    const uniqueIncluded = [
      ...new Set(included.map((item: Resource) => `${item.type}_${item.id}`))
    ].map(typeId =>
      included.find((item: Resource) => `${item.type}_${item.id}` === typeId)
    );

    const serializedResources = await this.serializeResources(data);

    return included.length
      ? { included: uniqueIncluded, data: serializedResources }
      : { data: serializedResources };
  }

  async serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }
    const dataArrayed = Array.isArray(data) ? data : [data];
    const resource = await this.resourceFor(dataArrayed[0].type);
    return dataArrayed.map(record => this.serializeResource(record, resource));
  }

  serializeResource(data: Resource, resource: typeof Resource): Resource {
    const resourceSchema = resource.schema;
    const schemaRelationships = resourceSchema.relationships;
    const relationshipsFound = Object.keys(schemaRelationships)
      .filter(relName => schemaRelationships[relName].belongsTo)
      .filter(
        relName =>
          data.attributes.hasOwnProperty(
            schemaRelationships[relName].foreignKeyName
          ) || data.attributes.hasOwnProperty(`${relName}Id`)
      )
      .map(relName => ({
        name: relName,
        key: schemaRelationships[relName].foreignKeyName || `${relName}Id`
      }));

    data.relationships = relationshipsFound.reduce(
      (relationships, relationship) => ({
        ...relationships,
        [relationship.name]: {
          id: data.attributes[relationship.key],
          type: schemaRelationships[relationship.name].type().type
        }
      }),
      data.relationships as any
    );

    data.attributes = unpick(
      data.attributes,
      relationshipsFound
        .map(relationship => relationship.key)
        .filter(
          relationshipKey =>
            !Object.keys(resourceSchema.attributes).includes(relationshipKey)
        )
    );
    Object.keys(data.relationships).forEach(relName => {
      const fkName = schemaRelationships[relName].belongsTo
        ? "id"
        : schemaRelationships[relName].type().schema.primaryKeyName ||
          DEFAULT_PRIMARY_KEY;

      const relationship = this.serializeRelationship(
        (data.relationships[relName] as unknown) as Resource | Resource[],
        fkName
      );
      data.relationships[relName] = {
        data: relationship
      };
    });

    return data;
  }

  serializeRelationship(
    relationships: Resource | Resource[],
    primaryKeyName: string
  ) {
    if (Array.isArray(relationships)) {
      return relationships.map(relationship =>
        this.serializeRelationship(relationship, primaryKeyName)
      );
    }
    relationships.id = relationships[primaryKeyName];
    if (!relationships.id) {
      return null;
    }

    return pick(relationships, ["id", "type"]);
  }

  // TODO: remove type any for data.relationships[relationshipName]
  // TODO: improve this function, there's repeated code that I don't like
  async extractIncludedResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }
    if (Array.isArray(data)) {
      return Promise.all(
        data.map(record => this.extractIncludedResources(record))
      );
    }

    const schemaRelationships = (await this.resourceFor(data.type)).schema
      .relationships;
    const includedData: Resource[] = [];
    Object.keys(data.relationships)
      .filter(relationshipName => data.relationships[relationshipName])
      .forEach(relationshipName => {
        if (Array.isArray(data.relationships[relationshipName])) {
          data.relationships[relationshipName] = (data.relationships[
            relationshipName
          ] as any).map(rel => {
            const relatedResourceClass = schemaRelationships[
              relationshipName
            ].type();
            const resource = rel[0] || rel;
            const pkName =
              relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

            if (resource[pkName]) {
              includedData.push(
                this.serializeResource(
                  new relatedResourceClass({
                    id: resource[pkName],
                    attributes: unpick(resource, [pkName])
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
          const relatedResourceClass = schemaRelationships[
            relationshipName
          ].type();
          const pkName =
            relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

          if (resource[pkName]) {
            includedData.push(
              this.serializeResource(
                new relatedResourceClass({
                  id: resource[pkName],
                  attributes: unpick(resource, [pkName])
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
