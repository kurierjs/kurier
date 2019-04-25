import flatten = require("flatten");
import OperationProcessor from "./processors/operation-processor";
import Resource from "./resource";
import {
  Operation,
  OperationResponse,
  Links,
  ResourceRelationships,
  ResourceRelationship
} from "./types";
import pick from "./utils/pick";
import unpick from "./utils/unpick";

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
    return await this.createTransaction(
      ops
        .map(async op => {
          const processor = await this.processorFor(op.ref.type);

          if (processor) {
            return this.executeOperation(op, processor);
          }
        })
        .filter(Boolean)
    );
  }

  async executeOperation(
    op: Operation,
    processor: OperationProcessor<Resource>
  ): Promise<OperationResponse> {
    const result = await processor.execute(op);
    return this.buildOperationResponse(result);
  }

  async createTransaction(ops: Promise<OperationResponse>[]) {
    return await Promise.all(ops);
  }

  async processorFor(
    resourceType: string
  ): Promise<OperationProcessor<Resource> | undefined> {
    const resourceClass = await this.resourceFor(resourceType);

    const processors = await Promise.all(
      this.processors.map(async processor =>
        (await processor.shouldHandle(resourceType)) ? processor : false
      )
    );

    const processor = processors.find(p => p !== false);

    if (processor) {
      return new processor(this);
    }

    class ResourceProcessor extends this.defaultProcessor<Resource> {
      static resourceClass = resourceClass;
    }

    return new ResourceProcessor(this);
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
    const uniqueIncluded =
      [...new Set(included.map((item: Resource) => `${item.type}_${item.id}`))]
        .map(type_id =>
          included.find((item: Resource) => (`${item.type}_${item.id}` === type_id))
        );


    return included.length ?
      { included: uniqueIncluded, data: await this.serializeResources(data) } :
      { data: await this.serializeResources(data) };
  }

  async serializeResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return Promise.all(data.map(record => this.serializeResources(record)));
    }

    const resourceSchema = (await this.resourceFor(data.type)).schema;
    const schemaRelationships = resourceSchema.relationships;

    const relationshipsFound = Object.keys(schemaRelationships)
      .filter(relName => schemaRelationships[relName].belongsTo)
      .filter(
        relName =>
          data.attributes.hasOwnProperty(
            schemaRelationships[relName].foreignKeyName
          ) ||
          data.attributes.hasOwnProperty(`${schemaRelationships[relName]}Id`)
      )
      .map(
        relationshipName => ({
          name: relationshipName,
          key:
            schemaRelationships[relationshipName].foreignKeyName ||
            `${schemaRelationships[relationshipName]}Id`
        }));

    data.relationships = relationshipsFound.reduce((relationships, relationship) => ({
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
        .filter(relationshipKey =>
          !Object.keys(resourceSchema.attributes).includes(relationshipKey)
        )
    );

    Object.keys(data.relationships).forEach(relationshipName => {
      const relationships = this.serializeRelationship((data.relationships[
        relationshipName
      ] as unknown) as Resource | Resource[]);

      if (relationships.length) {
        data.relationships[relationshipName] = {
          data: relationships,
          links: {} as Links
        };
      } else {
        data.relationships[relationshipName] = relationships;
      }
    });

    return data;
  }

  serializeRelationship(relationships: Resource | Resource[]) {
    if (Array.isArray(relationships)) {
      return relationships.map(relationship =>
        this.serializeRelationship(relationship)
      );
    }

    return pick(relationships, ["id", "type"]);
  }
  // TODO: remove type any for data.relationships[relationshipName]
  async extractIncludedResources(data: Resource | Resource[] | void) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return Promise.all(
        data.map(record => this.extractIncludedResources(record))
      );
    }

    const schemaRelationships = (await this.resourceFor(data.type)).schema.relationships;
    const includedData: Resource[] = [];

    Object.keys(data.relationships).filter(relationshipName => data.relationships[relationshipName]).forEach(relationshipName => {
      if (Array.isArray(data.relationships[relationshipName])) {
        data.relationships[relationshipName] =
          (data.relationships[relationshipName] as any).map(rel => {
            const relatedResourceClass = schemaRelationships[relationshipName].type();
            const resource = rel[0] || rel;

            if (resource["id"]) {
              includedData.push(
                new relatedResourceClass({
                  id: resource["id"],
                  attributes: unpick(resource, ["id"])
                })
              );
            }

            rel["type"] = relatedResourceClass.type;
            rel.links = {};
            return rel;
          });
      } else {
        const relatedResourceClass = schemaRelationships[relationshipName].type();

        if (data.relationships[relationshipName]["id"]) {
          includedData.push(
            new relatedResourceClass({
              id: data.relationships[relationshipName]["id"],
              attributes: unpick(data.relationships[relationshipName], ["id"])
            })
          );
        }

        data.relationships[relationshipName]["type"] =
          relatedResourceClass.type;
      }
    });

    return includedData;
  }
}
