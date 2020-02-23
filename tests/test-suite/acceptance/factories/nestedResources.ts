import { getFactoryObjects, getFactoryObject } from "./utils";
import { votes } from "./vote";
import { articles } from "./article";
import { users } from "./user";

export default {
  get: {
    authorAndAuthorVotesOf1stArticle: {
      "data": getFactoryObject(articles)(1),
      "included": [
        getFactoryObject(users)(1),
        ...getFactoryObjects(votes)([1, 2])
      ]
    },

  }
};
