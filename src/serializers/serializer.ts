import { camelize, underscore, classify, pluralize } from "../utils/string";
import { IJsonApiSerializer, DEFAULT_PRIMARY_KEY, ResourceRelationshipData, Operation } from "../types";
import Resource from "../resource";
import unpick from "../utils/unpick";
import pick from "../utils/pick";
import Password from "../attribute-types/password";
import flatten from "../utils/flatten";

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
      .filter(relName => schemaRelationships[relName].belongsTo && op.data.relationships.hasOwnProperty(relName))
      .reduce((relationAttributes, relName) => {
        const key = schemaRelationships[relName].foreignKeyName || this.relationshipToColumn(relName, primaryKey);
        const value = (<ResourceRelationshipData>op.data.relationships[relName].data).id;

        return {
          ...relationAttributes,
          [key]: value
        };
      }, op.data.attributes);
    return op;
  }

  serializeResource(data: Resource, resourceType: typeof Resource): Resource {
    const resourceSchema = resourceType.schema;
    const schemaRelationships = resourceSchema.relationships;
    const relationshipsFound = Object.keys(schemaRelationships)
      .filter(relName => schemaRelationships[relName].belongsTo)
      .filter(
        relName =>
          data.attributes.hasOwnProperty(schemaRelationships[relName].foreignKeyName) ||
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
          type: schemaRelationships[relationship.name].type().type
        }
      }),
      data.relationships as any
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
      .filter(relName => data.relationships[relName])
      .forEach(relName => {
        const fkName = schemaRelationships[relName].belongsTo
          ? DEFAULT_PRIMARY_KEY
          : schemaRelationships[relName].type().schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

        data.relationships[relName] = {
          data: this.serializeRelationship(
            (data.relationships[relName] as unknown) as Resource | Resource[],
            schemaRelationships[relName].type(),
            fkName
          )
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

    return pick(relationships, ["id", "type"]) as ResourceRelationshipData[];
  }

  serializeIncludedResources(data: Resource | Resource[] | void, resourceType: typeof Resource) {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(record => this.serializeIncludedResources(record, resourceType));
    }

    const schemaRelationships = resourceType.schema.relationships;
    const includedData = [];

    Object.keys(data.relationships)
      .filter(relationshipName => data.relationships[relationshipName])
      .map(relationshipName => ({ relationshipName, resources: flatten([data.relationships[relationshipName]]) }))
      .forEach(({ relationshipName, resources }: { relationshipName: string; resources: Resource[] }) => {
        const relatedResourceClass = schemaRelationships[relationshipName].type();
        const pkName = relatedResourceClass.schema.primaryKeyName || DEFAULT_PRIMARY_KEY;

        includedData.push(
          ...resources
            .filter(resource => resource[pkName])
            .map(resource => ({
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
                relatedResourceClass
              ),
              type: relatedResourceClass.type
            }))
        );
      });

    return [...new Set(includedData.map((item: Resource) => `${item.type}_${item.id}`))].map(typeId =>
      includedData.find((item: Resource) => `${item.type}_${item.id}` === typeId)
    );
  }
}
