import LatitudeLongitude from "../attribute-types/latitude-longitude";
import { User as JsonApiUser, Password } from "../kurier";
import Article from "./article";
import Comment from "./comment";
import Vote from "./vote";

export default class User extends JsonApiUser {
  static schema = {
    attributes: {
      username: String,
      email: String,
      password: Password,
      location: LatitudeLongitude,
    },

    relationships: {
      articles: {
        type: () => Article,
        hasMany: true,
        foreignKeyName: "author",
      },
      comments: {
        type: () => Comment,
        hasMany: true,
        foreignKeyName: "author_id",
      },
      votes: {
        type: () => Vote,
        hasMany: true,
      },
    },
  };
}
