import { Resource } from "../../jsonapi-ts";

export default class User extends Resource {
  /**
   * relationships: {
   *   @belongsTo // relationKey: publication_id, reflectionKey: id
   *   publication: Publication,
   *
   *   @hasOne // relationKey: id, reflectionKey: user_id
   *   profile: Profile,
   *
   *   @hasMany // relationKey: id, reflectionKey: user_id
   *   posts: Post[]
   * }
   */
}
