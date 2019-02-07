import * as Knex from "knex";
import { userInfo } from "os";

import Resource from "../resource";
import { KnexRecord, Operation, ResourceConstructor } from "../types";
import { classify, pluralize, singularize, underscore } from "../utils/string";

import OperationProcessor from "./operation-processor";

export default class KnexProcessor<
  ResourceT extends ResourceConstructor
> extends OperationProcessor<ResourceT> {
  private knex: Knex;

  constructor(public knexOptions: Knex.Config = {}) {
    super();

    this.knex = Knex(knexOptions);
  }

  protected async get(op: Operation): Promise<Resource[]> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);
    const filters = op.params ? { id, ...(op.params.filter || {}) } : { id };

    const records: KnexRecord[] = await this.knex(tableName)
      .where(this.filtersToKnex(filters))
      .select();

    const resources = this.convertToResources(type, records);
    const include = op.params.include;

    if (include) {
      this.preloadRelationships(resources, include);
    }

    return resources;
  }

  async preloadRelationships(resources: Resource[], relationNames: string[]) {
    const resourceClass: ResourceConstructor =
      resources[0] && (resources[0].constructor as ResourceConstructor);

    if (resourceClass) {
      relationNames.forEach(async relationName => {
        const relationshipType = this.resourceRelationshipType(
          resourceClass,
          relationName
        );

        const relationKey = this.relationKeyFor(resourceClass, relationName);
        const reflectionKey = this.reflectionKeyFor(
          resourceClass,
          relationName
        );

        const relationType = this.detectRelationType(
          resourceClass,
          relationName
        );

        if (relationType === "belongsTo") {
          const ids = resources.map(r => r[reflectionKey]);
          const relationshipsRecords = await this.knex(
            this.typeToTableName(relationshipType)
          ).where({ [relationKey]: ids });

          resources.forEach((resource) => {
            resource[relationName] = relationshipsRecords.filter(r => r[reflectionKey] === ???)
          })
        } else if (relationType === "hasMany") {
          const ids = resources.map(r => r[relationKey]);
          const relationshipsRecords = await this.knex(
            this.typeToTableName(relationshipType)
          ).where({ [reflectionKey]: ids });
        } else if (relationType === "hasOne") {
          const ids = resources.map(r => r[relationKey]);
          const relationshipsRecords = await this.knex(
            this.typeToTableName(relationshipType)
          ).where({ [reflectionKey]: ids });

          relationshipRecord;
        }
      });
    }
  }

  relationKeyFor(
    resourceClass: ResourceConstructor,
    relationName: string
  ): string {
    return "id";
  }

  reflectionKeyFor(
    resourceClass: ResourceConstructor,
    relationName: string
  ): string {
    return "user_id";
  }

  resourceRelationshipType(
    resourceClass: ResourceConstructor,
    relationName: string
  ): string {
    return classify(singularize(relationName));
  }

  detectRelationType(
    resourceClass: ResourceConstructor,
    relationName: string
  ): string {
    return "hasMany";
  }

  protected async remove(op: Operation): Promise<void> {
    const tableName = this.typeToTableName(op.ref.type);

    return await this.knex(tableName)
      .where({ id: op.ref.id })
      .del()
      .then(() => undefined);
  }

  protected async update(op: Operation): Promise<Resource> {
    const { id, type } = op.ref;
    const tableName = this.typeToTableName(type);

    await this.knex(tableName)
      .where({ id })
      .update(op.data.attributes);

    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(type, records)[0];
  }

  protected async add(op: Operation): Promise<Resource> {
    const { type } = op.ref;
    const tableName = this.typeToTableName(type);

    const [id] = await this.knex(tableName).insert(op.data.attributes);
    const records: KnexRecord[] = await this.knex(tableName)
      .where({ id })
      .select();

    return this.convertToResources(type, records)[0];
  }

  private convertToResources(type: string, records: KnexRecord[]) {
    return records.map(record => {
      const id = record.id;
      delete record.id;
      const attributes = record;
      const resourceClass: ResourceConstructor = this.resourceFor(type);

      return new resourceClass({ id, attributes });
    });
  }

  private typeToTableName(type: string): string {
    return underscore(pluralize(type));
  }

  private filtersToKnex(filters: {}): {} {
    Object.keys(filters).forEach(
      key => filters[key] === undefined && delete filters[key]
    );

    return filters;
  }
}
