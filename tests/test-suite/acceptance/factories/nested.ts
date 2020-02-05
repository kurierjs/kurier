import { getFactoryObjects, getFactoryObject } from "./utils";
import { votes } from "./vote";
import article from "./article";

export default {
  get: {
    votesOf1stArticle: {
      "data": [
        ...getFactoryObjects(votes)([1, 2])
      ]
    },
    votesOf2ndArticle: {
      "data": []
    },
    votesOf3rdArticle: {
      "data": [
        getFactoryObject(votes)(3)
      ]
    },
    articleOf1stVote: {
      "data": article.toGet.response[0]
    }
  }
};
