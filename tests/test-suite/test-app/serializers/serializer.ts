import { JsonApiSerializer, pluralize } from "./../kurier";

export default class Serializer extends JsonApiSerializer {
  resourceTypeToTableName(resourceType: string): string {
    return pluralize(resourceType);
  }

  attributeToColumn(attributeName: string): string {
    return attributeName;
  }

  columnToAttribute(columnName: string): string {
    return columnName;
  }

  columnToRelationship(columnName: string, primaryKeyName: string = "Id"): string {
    return this.columnToAttribute(columnName.replace(`${'Id'}`, ""));
  }

  relationshipToColumn(relationshipName: string, primaryKeyName: string = "Id"): string {
    return `${relationshipName}${'Id'}`;
  }

  foreignResourceToForeignTableName(foreignResourceType: string, prefix: string = "belonging"): string {
    return `${prefix} ${this.resourceTypeToTableName(foreignResourceType)}`;
  }
}
