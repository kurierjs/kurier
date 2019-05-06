import { camelize, underscore, classify, pluralize } from "../utils/string";
import { IJsonApiSerializer } from "../types";

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

  columnToRelationship(columnName: string, primaryKeyName: string): string {
    return this.columnToAttribute(columnName.replace(`_${primaryKeyName}`, ""));
  }

  relationshipToColumn(relationshipName: string, primaryKeyName: string): string {
    return this.attributeToColumn(`${relationshipName}${classify(primaryKeyName)}`);
  }

  foreignResourceToForeignTableName(foreignResourceType: string, prefix: string = "belonging"): string {
    return underscore(`${prefix} `) + this.resourceTypeToTableName(foreignResourceType);
  }
}
