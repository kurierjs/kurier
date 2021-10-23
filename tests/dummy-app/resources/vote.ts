import { Resource } from "../kurier";
import User from "./user";
import Article from "./article";

export default class Vote extends Resource {
  static schema = {
    primaryKeyName: "_Id",
    attributes: {
      points: Number,
      createdOn: String,
      updatedOn: String,
      updatedBy: Number,
      createdBy: Number,
    },

    relationships: {
      user: {
        type: () => User,
        belongsTo: true,
      },
      article: {
        type: () => Article,
        belongsTo: true,
        foreignKeyName: "article_id",
      },
    },
  };
}
