import { Resource } from "../kurier";
import User from "./user";
import Vote from "./vote";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String,
    },

    relationships: {
      author: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: "author",
        excludeLinks: ["self", "related"],
        alwaysIncludeLinkageData: true,
      },
      votes: {
        type: () => Vote,
        hasMany: true,
        excludeLinks: ["self", "related"],
      },
    },
  };

  static excludeLinks = ["self"];
}
