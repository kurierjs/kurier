import { getFactoryObjects } from "./utils";
import { votes } from "./vote";

export default {
  get: {
    votesOf1stArticle: {
      "data": [
        ...getFactoryObjects(votes)([1, 2])
      ]
    }
  }
};
