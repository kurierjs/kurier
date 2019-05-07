import { camelize, underscore, classify, pluralize } from "../utils/string";
import { IJsonApiSerializer, DEFAULT_PRIMARY_KEY, ResourceRelationshipData } from "../types";
import Resource from "../resource";
import unpick from "../utils/unpick";
import pick from "../utils/pick";

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

  columnToRelationship(columnName: string, primaryKeyName: string = "id"): string {
    return this.columnToAttribute(columnName.replace(`_${primaryKeyName}`, ""));
  }

  relationshipToColumn(relationshipName: string, primaryKeyName: string = DEFAULT_PRIMARY_KEY): string {
    return this.attributeToColumn(`${relationshipName}${classify(primaryKeyName)}`);
  }

  foreignResourceToForeignTableName(foreignResourceType: string, prefix: string = "belonging"): string {
    return underscore(`${prefix} `) + this.resourceTypeToTableName(foreignResourceType);
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

  serializeRelationship(relationships: Resource | Resource[], primaryKeyName: string = DEFAULT_PRIMARY_KEY) {
    if (Array.isArray(relationships)) {
      return relationships.map(relationship => this.serializeRelationship(relationship, primaryKeyName));
    }
    relationships.id = relationships[primaryKeyName || DEFAULT_PRIMARY_KEY];
    if (!relationships.id) {
      return null;
    }

    return pick(relationships, ["id", "type"]) as ResourceRelationshipData[];
  }
}
