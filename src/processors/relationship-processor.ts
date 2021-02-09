import { KnexProcessor, Resource } from "..";
import { Operation } from "../types";

export default class RelationshipProcessor<ResourceT extends Resource> extends KnexProcessor<ResourceT> {
  public relationshipResourceFor(id: string): Resource {
    const { type: resourceClassType } = this.resourceClass;

    class RelationshipResource extends this.resourceClass {
      static get type() {
        return resourceClassType;
      }
    }

    return new RelationshipResource({ id });
  }

  public async get(op: Operation) {
    return op.meta?.belongsTo
      ? super.get({
          op: "get",
          ref: {
            type: op.ref.type
          },
          params: {
            fields: {
              [this.resourceClass.type]: [
                this.resourceClass.schema.relationships[`${op.ref.relationship}`].foreignKeyName ||
                  this.appInstance.app.serializer.relationshipToColumn(`${op.ref.relationship}`)
              ]
            }
          }
        })
      : super.get(op);
  }
}
