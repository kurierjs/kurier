import Resource from "./resource";
import {
  BelongsToResourceSchemaRelationship,
  HasManyResourceSchemaRelationship,
  ResourceSchemaRelationshipOptions,
} from "./types";

export const HasMany = (
  resourceType: typeof Resource,
  options: ResourceSchemaRelationshipOptions,
): HasManyResourceSchemaRelationship => ({
  hasMany: true,
  type: () => resourceType,
  ...options,
});

export const BelongsTo = (
  resourceType: typeof Resource,
  options: ResourceSchemaRelationshipOptions,
): BelongsToResourceSchemaRelationship => ({
  belongsTo: true,
  type: () => resourceType,
  ...options,
});
