import Password from "../attribute-types/password";
import Resource from "../resource";
import {
  DEFAULT_PRIMARY_KEY,
  EagerLoadedData,
  IJsonApiSerializer,
  Operation,
  ResourceRelationshipData,
  ResourceRelationshipDescriptor
} from "../types";
import { getRelationshipLinks } from "../utils/links";
import pick from "../utils/pick";
import { camelize, classify, pluralize, underscore } from "../utils/string";
import unpick from "../utils/unpick";

export default class JsonApiSerializer implements IJsonApiSerializer {
  resourceTypeToTableName(resourceType: string): string {
    return underscore(pluralize(resourceType));
  }

  attributeToColumn(attributeName: string): string {
    return underscore(attributeName);
  }

  columnToAttribute(columnName: string): string {
    return camelize(columnName);
  }

  columnToRelationship(columnName: string, primaryKeyName: string = DEFAULT_PRIMARY_KEY): string {
    return this.columnToAttribute(columnName.replace(`_${primaryKeyName}`, ""));
  }

  relationshipToColumn(relationshipName: string, primaryKeyName: string = DEFAULT_PRIMARY_KEY): string {
    return this.attributeToColumn(`${relationshipName}${classify(primaryKeyName)}`);
  }

  foreignResourceToForeignTableName(foreignResourceType: string, prefix: string = "belonging"): string {
    return underscore(`${prefix} `) + this.resourceTypeToTableName(foreignResourceType);
  }

  deserializeResource(op: Operation, resourceType: typeof Resource): Operation {
    if (!op.data || !op.data.attributes || !op.data.relationships) {
      return op;
    }

    const primaryKey = resourceType.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const schemaRelationships = resourceType.schema.relationships;
    op.data.attributes = Object.keys(schemaRelationships)
      .filter(relName => schemaRelationships[relName].belongsTo && op.data?.relationships.hasOwnProperty(relName))
      .reduce((relationAttributes, relName) => {
        const key = schemaRelationships[relName].foreignKeyName || this.relationshipToColumn(relName, primaryKey);
        const value = (<ResourceRelationshipData>op.data?.relationships[relName].data).id;

        return {
          ...relationAttributes,
          [key]: value
        };
      }, op.data.attributes);
    return op;
  }

  serializeResource(data: Resource, resourceType: typeof Resource, baseUrl: URL): Resource {
    const resourceSchema = resourceType.schema;
    const schemaRelationships = resourceSchema.relationships;
    const relationshipsFound = Object.keys(schemaRelationships)
      .filter(relName => schemaRelationships[relName].belongsTo)
      .filter(
        relName =>
          data.attributes.hasOwnProperty(`${schemaRelationships[relName].foreignKeyName}`) ||
          data.attributes.hasOwnProperty(
            this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName)
          )
      )
      .map(relName => ({
        name: relName,
        key:
          schemaRelationships[relName].foreignKeyName ||
          this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName)
      }));

    data.relationships = relationshipsFound.reduce(
      (relationships, relationship) => ({
        ...relationships,
        [relationship.name]: {
          id: data.attributes[relationship.key],
          type: schemaRelationships[relationship.name].type().type,
        }
      }),
      Object.entries(data.relationships as EagerLoadedData).reduce(
        (includedDirectRelationships, [relName, relData]: [string, ResourceRelationshipDescriptor]) => ({
          ...includedDirectRelationships,
          [relName]: relData.direct,
          ...relData.nested
        }),
        {}
      )
    );

    data.attributes = unpick(
      data.attributes,
      relationshipsFound
        .map(relationship => relationship.key)
        .filter(relationshipKey => !Object.keys(resourceSchema.attributes).includes(relationshipKey))
        .concat(
          Object.keys(resourceSchema.attributes).filter(
            attributeKey => resourceSchema.attributes[attributeKey] === Password
          )
        )
    );

    data.attributes = Object.keys(data.attributes)
      .map(attribute => ({
        [this.columnToAttribute(attribute)]: data.attributes[attribute]
      }))
      .reduce((keyValues, keyValue) => ({ ...keyValues, ...keyValue }), {});

    Object.keys(data.relationships)
      .filter(relName => data.relationships?.[relName])
      .forEach(relName => {
        const fkName = schemaRelationships[relName].belongsTo
          ? DEFAULT_PRIMARY_KEY
          : schemaRelationships[relName].type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

        const serializedData = this.serializeRelationship(
          (data.relationships?.[relName] as unknown) as Resource | Resource[],
          schemaRelationships[relName].type(),
          fkName
        );

        const links = getRelationshipLinks({
          type: data.type,
          id: data.id as string,
          relName,
          baseUrl,
        });

        data.relationships[relName] = {
          links,
          data: serializedData,
        };
      });

    return data;
  }

  serializeRelationship(
    relationships: Resource | Resource[],
    resourceType: typeof Resource,
    primaryKeyName: string = DEFAULT_PRIMARY_KEY
  ) {
    if (Array.isArray(relationships)) {
      return relationships.map(relationship => this.serializeRelationship(relationship, resourceType, primaryKeyName));
    }

    relationships.id = relationships[primaryKeyName || DEFAULT_PRIMARY_KEY];

    if (!relationships.id) {
      return null;
    }

    relationships.type = resourceType.type;

    return pick<Resource, ResourceRelationshipData[]>(relationships, ["id", "type"]);
  }

  serializeIncludedResources(data: Resource | Resource[] | void, resourceType: typeof Resource, baseUrl: URL) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(record => this.serializeIncludedResources(record, resourceType, baseUrl));
    }

    if (data.preventSerialization) { return [] }

    const schemaRelationships = resourceType.schema.relationships;
    const includedData: (Resource | undefined)[] = [];

    Object.keys(data.relationships)
      .filter(relationshipName => data.relationships[relationshipName])
      .map(relationshipName => ({ relationshipName, resources: data.relationships[relationshipName] as ResourceRelationshipDescriptor }))
      .forEach(({ relationshipName, resources }: { relationshipName: string; resources: ResourceRelationshipDescriptor }) => {
        const { direct: directResources = [], nested: nestedResources = [] } = resources;
        const relatedResourceClass = schemaRelationships[relationshipName].type();
        const pkName = relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

        includedData.push(
          ...directResources.map(resource => {
            if (resource[pkName]) {
              return {
                ...this.serializeResource(
                  new relatedResourceClass({
                    id: resource[pkName],
                    attributes: unpick(resource, [
                      pkName,
                      ...Object.keys(relatedResourceClass.schema.attributes).filter(
                        attribute => relatedResourceClass.schema.attributes[attribute] === Password
                      )
                    ])
                  }),
                  relatedResourceClass,
                  baseUrl,
                ),
                type: relatedResourceClass.type
              } as Resource;
            }
          })
        );

        if (nestedResources) {
          includedData.push(
            ...Object.entries(nestedResources).map(([subRelationName, nestedRelationData]) => {
              const subResourceClass = relatedResourceClass.schema.relationships[subRelationName].type();
              const subPkName = subResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
              return nestedRelationData.map((resource: Resource) => {
                if (resource[subPkName]) {
                  return {
                    ...this.serializeResource(
                      new subResourceClass({
                        id: resource[subPkName],
                        attributes: unpick(resource, [
                          subPkName,
                          ...Object.keys(subResourceClass.schema.attributes).filter(
                            attribute => subResourceClass.schema.attributes[attribute] === Password
                          )
                        ]),
                        // A drunk Santiago walks in the bar...
                        relationships: {} // nestedResources.filter
                      }),
                      subResourceClass,
                      baseUrl,
                    ),
                    type: subResourceClass.type
                  } as Resource;
                }
              });
            })
          );
        }
      });
    return [...new Set(includedData.map((item: Resource) => `${item.type}_${item.id}`))].map(typeId =>
      includedData.find((item: Resource) => `${item.type}_${item.id}` === typeId)
    );
  }
}
