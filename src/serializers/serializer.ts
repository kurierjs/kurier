import Password from "../attribute-types/password";
import Resource from "../resource";
import {
  ApplicationAttributeType,
  ApplicationAttributeTypeFactory,
  ApplicationAttributeTypes,
  DEFAULT_PRIMARY_KEY,
  EagerLoadedData,
  IJsonApiSerializer,
  Operation,
  ResourceRelationshipData,
  ResourceRelationshipDescriptor,
  ResourceSchema,
} from "../types";
import pick from "../utils/pick";
import { camelize, classify, pluralize, underscore } from "../utils/string";
import unpick from "../utils/unpick";

export default class JsonApiSerializer implements IJsonApiSerializer {
  attributeTypes: ApplicationAttributeTypes = [];

  constructor() {
    this.registerAttributeType(Password);
  }

  registerAttributeType(attributeDefinition: ApplicationAttributeTypeFactory) {
    const attribute = new attributeDefinition();
    this.attributeTypes.push({
      name: attributeDefinition.name,
      definition: attribute,
    });
  }

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

  foreignResourceToForeignTableName(foreignResourceType: string, prefix = "belonging"): string {
    return underscore(`${prefix} `) + this.resourceTypeToTableName(foreignResourceType);
  }

  deserializeResource(op: Operation, resourceType: typeof Resource): Operation {
    if (!op.data || !op.data.attributes || !op.data.relationships) {
      return op;
    }

    for (const [attribute, value] of Object.entries(op.data.attributes)) {
      op.data.attributes[attribute] = this.deserializeAttribute(resourceType.schema, attribute, value);
    }

    const primaryKey = resourceType.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
    const schemaRelationships = resourceType.schema.relationships;
    op.data.attributes = Object.keys(schemaRelationships)
      .filter((relName) => schemaRelationships[relName].belongsTo && op.data?.relationships.hasOwnProperty(relName))
      .reduce((relationAttributes, relName) => {
        const key = schemaRelationships[relName].foreignKeyName || this.relationshipToColumn(relName, primaryKey);
        const value = (<ResourceRelationshipData>op.data?.relationships[relName].data).id;
        relationAttributes[key] = value;
        return relationAttributes;
      }, op.data.attributes);
    return op;
  }

  getAttributeDefinition(resourceSchema: ResourceSchema, attributeName: string): ApplicationAttributeType | undefined {
    const resourceSchemaAttribute = resourceSchema.attributes[attributeName];
    const attributeDefinition = this.attributeTypes.find(
      (attribute) => attribute.definition.constructor === resourceSchemaAttribute,
    );
    return attributeDefinition;
  }

  isSensitiveAttribute(resourceSchema: ResourceSchema, attributeName: string): boolean {
    const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);

    if (!attributeDefinition) {
      return false;
    }

    return attributeDefinition.definition.isSensitive;
  }

  serializeResource(data: Resource, resourceType: typeof Resource): Resource {
    const resourceSchema = resourceType.schema;
    const schemaRelationships = resourceSchema.relationships;
    const relationshipsFound = Object.keys(schemaRelationships)
      .filter((relName) => schemaRelationships[relName].belongsTo)
      .filter(
        (relName) =>
          data.attributes.hasOwnProperty(`${schemaRelationships[relName].foreignKeyName}`) ||
          data.attributes.hasOwnProperty(
            this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName),
          ),
      )
      .map((relName) => ({
        name: relName,
        key:
          schemaRelationships[relName].foreignKeyName ||
          this.relationshipToColumn(relName, schemaRelationships[relName].type().schema.primaryKeyName),
      }));

    const eagerlyLoadedRelationships = Object.entries(data.relationships as EagerLoadedData).reduce(
      (includedDirectRelationships, [relName, relData]: [string, ResourceRelationshipDescriptor]) => {
        includedDirectRelationships[relName] = relData.direct;
        return includedDirectRelationships;
      },
      {},
    );

    data.relationships = relationshipsFound.reduce((relationships, relationship) => {
      relationships[relationship.name] = {
        id: data.attributes[relationship.key],
        type: schemaRelationships[relationship.name].type().type,
      };
      return relationships;
    }, eagerlyLoadedRelationships);

    Object.keys(data.relationships)
      .filter((relName) => data.relationships[relName] && schemaRelationships[relName])
      .forEach((relName) => {
        const fkName = schemaRelationships[relName].belongsTo
          ? DEFAULT_PRIMARY_KEY
          : schemaRelationships[relName].type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

        data.relationships[relName] = {
          data: this.serializeRelationship(
            data.relationships[relName] as unknown as Resource | Resource[],
            schemaRelationships[relName].type(),
            fkName,
          ),
        };
      });

    data.attributes = unpick(
      data.attributes,
      relationshipsFound
        .map((relationship) => relationship.key)
        .filter((relationshipKey) => !Object.keys(resourceSchema.attributes).includes(relationshipKey))
        .concat(
          Object.keys(resourceSchema.attributes).filter((attributeKey) =>
            this.isSensitiveAttribute(resourceSchema, attributeKey),
          ),
        ),
    );

    data.attributes = Object.assign(
      {},
      ...Object.keys(data.attributes).map((attribute) => ({
        [this.columnToAttribute(attribute)]: this.serializeAttribute(
          resourceSchema,
          attribute,
          data.attributes[attribute],
        ),
      })),
    );

    return data;
  }

  serializeAttribute(resourceSchema: ResourceSchema, attributeName: string, value: unknown) {
    const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);

    if (!attributeDefinition || !attributeDefinition.definition.serialize) {
      return value;
    }

    return attributeDefinition.definition.serialize(value);
  }

  deserializeAttribute(resourceSchema: ResourceSchema, attributeName: string, value: unknown) {
    const attributeDefinition = this.getAttributeDefinition(resourceSchema, attributeName);

    if (!attributeDefinition || !attributeDefinition.definition.deserialize) {
      return value;
    }

    return attributeDefinition.definition.deserialize(value);
  }

  serializeRelationship(
    relationships: Resource | Resource[],
    resourceType: typeof Resource,
    primaryKeyName: string = DEFAULT_PRIMARY_KEY,
  ) {
    if (Array.isArray(relationships)) {
      return relationships.map((relationship) =>
        this.serializeRelationship(relationship, resourceType, primaryKeyName),
      );
    }

    relationships.id = relationships[primaryKeyName || DEFAULT_PRIMARY_KEY];

    if (!relationships.id) {
      return null;
    }

    relationships.type = resourceType.type;

    return pick<Resource, ResourceRelationshipData[]>(relationships, ["id", "type"]);
  }

  serializeIncludedResources(data: Resource | Resource[] | void, resourceType: typeof Resource) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map((record) => this.serializeIncludedResources(record, resourceType));
    }

    if (data.preventSerialization) {
      return [];
    }

    const schemaRelationships = resourceType.schema.relationships;
    let includedData: (Resource | undefined)[] = [];

    Object.keys(data.relationships)
      .filter((relationshipName) => data.relationships[relationshipName])
      .map((relationshipName) => ({
        relationshipName,
        resources: data.relationships[relationshipName] as ResourceRelationshipDescriptor,
      }))
      .forEach(
        ({ relationshipName, resources }: { relationshipName: string; resources: ResourceRelationshipDescriptor }) => {
          const { direct: directResources = [], nested: nestedResources = [] } = resources;
          const relatedResourceClass = schemaRelationships[relationshipName].type();
          const pkName = relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;
          includedData = includedData.concat(
            directResources.map((resource) => {
              if (resource[pkName]) {
                return {
                  ...this.serializeResource(
                    new relatedResourceClass({
                      id: resource[pkName],
                      attributes: unpick(resource, [
                        pkName,
                        ...Object.keys(relatedResourceClass.schema.attributes).filter((attribute) =>
                          this.isSensitiveAttribute(relatedResourceClass.schema, attribute),
                        ),
                      ]),
                      relationships: {}, //TODO: this is not responding with the nested relationship relations
                    }),
                    relatedResourceClass,
                  ),
                  type: relatedResourceClass.type,
                } as Resource;
              }
            }),
          );

          if (nestedResources) {
            includedData = includedData.concat(
              Object.entries(nestedResources).map(([subRelationName, nestedRelationData]) => {
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
                            ...Object.keys(subResourceClass.schema.attributes).filter((attribute) =>
                              this.isSensitiveAttribute(subResourceClass.schema, attribute),
                            ),
                          ]),
                          relationships: {}, // nestedResources.filter
                        }),
                        subResourceClass,
                      ),
                      type: subResourceClass.type,
                    } as Resource;
                  }
                });
              }),
            );
          }
        },
      );
    return [...new Set(includedData.map((item: Resource) => `${item.type}_${item.id}`))].map((typeId) =>
      includedData.find((item: Resource) => `${item.type}_${item.id}` === typeId),
    );
  }
}
