import * as flat from "array.prototype.flat";

import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  JsonApiParams,
  Operation,
  OperationResponse,
  ResourceConstructor
} from "./types";
import { camelize, classify, singularize } from "./utils/string";

function toArray(item: any): any[] {
  return (Array.isArray(item) ? item : [item]).filter(Boolean) as Resource[];
}

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
      ops.map(async op => {
        const processor = this.processorFor(op.ref.type);
        const data = await processor.execute(op);
        const included = await this.resolveIncludes(op, data);

        return this.buildOperationResponse(data, included);
      })
    );
  }

  async createTransaction(ops: Promise<OperationResponse>[]) {
    return await Promise.all(ops);
  }

  async resolveIncludes(
    op: Operation,
    data: Resource | Resource[] | void
  ): Promise<Resource[]> {
    const resourceType = op.ref.type;
    const resources: Resource[] = toArray(data);

    if (!resources.length) {
      return [];
    }

    const resourcesIds = resources.map((r: Resource) => r.id);

    const promises = (op.params.include || []).map(async include => {
      // For now we do not support nested includes like `user.profiles`
      const type = classify(singularize(include));
      const processor = this.processorFor(type);
      const resourceClass = this.resourceFor(resourceType);
      const relationship = resourceClass.relationships[include] || { kind: "" };
      const filterKey = this.relationshipFilterKey(
        resourceType,
        relationship.kind
      );

      const includeOp = {
        op: "get",
        ref: {
          type
        },
        params: {
          filter: {
            [filterKey]: resourcesIds
          }
        } as JsonApiParams
      } as Operation;

      const includedResources = await processor.execute(includeOp);

      toArray(includedResources).forEach(includedResource => {
        // assign relationships for includedResource
        Object.keys(includedResource.constructor.relationships).forEach(relationshipKey => {
            const relationship =
              includedResource.constructor.relationships[relationshipKey];

            if (relationship.kind === "belongsTo") {
              includedResource.relationships[relationshipKey] = {
                data: {
                  id: includedResource.attributes[filterKey],
                  type: relationship.type
                }
              };
            } else if (relationship.kind === "hasMany") {
              if (includedResource.relationships[relationshipKey].data) {
                includedResource.relationships[relationshipKey].data = [];
              }

              includedResource.relationships[relationshipKey].data.push({
                id: includedResource.id,
                type: relationship.type
              });
            }
          }
        );

        // assign included relationship for resource
        if (relationship.kind === "belongsTo") {
          const resource = resources.find(
            r => r.id === includedResource.id
          ) as Resource;

          resource.relationships[relationship.name].data = {
            id: includedResource.id,
            type: includedResource.type
          };
        } else if (relationship.kind === "hasMany") {
          const resource = resources.find(
            r => r.id === includedResource.attributes[filterKey]
          ) as Resource;

          resource.relationships[relationship.name] = {
            data: [{ id: includedResource.id, type: includedResource.type }]
          };
        }
      });

      return includedResources;
    });

    return flat(await Promise.all(promises));
  }

  relationshipFilterKey(type: string, relationshipKind: string): string {
    if (relationshipKind === "hasMany") {
      return `${camelize(singularize(type))}Id`;
    }

    return "id";
  }

  resourceFor(type: string = ""): ResourceConstructor {
    return this.types.find(({ name }: { name: string }) => {
      return name === classify(singularize(type));
    });
  }

  processorFor(type: string): OperationProcessor {
    return (
      this.processors.find(processor => processor.shouldHandle(type)) ||
      this.defaultProcessor
    );
  }

  buildOperationResponse(
    data: Resource | Resource[] | void,
    included: Resource[]
  ): OperationResponse {
    return {
      included,
      data: data || null
    };
  }
}
