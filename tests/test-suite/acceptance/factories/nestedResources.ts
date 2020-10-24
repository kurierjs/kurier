import { getFactoryObjects, getFactoryObject, getExtraRelationships } from "./utils";
import { votes } from "./vote";
import { articles, articlesWithExtraData } from "./article";
import { users, usersWithCreatedAt } from "./user";
import { comments } from "./comment";

export default {
  get: {
    authorAndAuthorVotesOf1stArticle: {
      "data": getFactoryObject(articles)(1),
      "included": [
        getFactoryObject(usersWithCreatedAt)(1),
        ...getFactoryObjects(votes)([1, 2])
      ]
    },
    articlesAndArticlesVotsOf2ndUser: {
      "data":  {...getFactoryObject(users)(2),
      "relationships":{
          ...getExtraRelationships(articles,'articles')([2,3])
        }
      },
      "included": [
        ...getFactoryObjects(articlesWithExtraData)([2, 3]),
        getFactoryObject(votes)(3)
      ]
    },
    parentCommentAndParentCommentsAuthorOf1stComment: {
      "data": getFactoryObject(comments)(1),
      "included": [
        getFactoryObject(comments)(2),
        getFactoryObject(usersWithCreatedAt)(2)
      ]
    },
    parentCommentAndParentCommentsParentCommentOf1stComment:{
      "data": getFactoryObject(comments)(1),
      "included": [
        getFactoryObject(comments)(2),
        getFactoryObject(comments)(3)
      ]
    },
  }
};
