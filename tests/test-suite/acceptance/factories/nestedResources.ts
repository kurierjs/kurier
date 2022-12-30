import { getFactoryObjects, getFactoryObject, getExtraRelationships } from "./utils";
import { votes } from "./vote";
import { articles } from "./article";
import { users } from "./user";
import { comments } from "./comment";

export default {
  get: {
    authorAndAuthorVotesOf1stArticle: {
      data: {
        ...getFactoryObject(articles)(1),
        relationships: {
          ...getExtraRelationships(users, "author")([1], "Object"),
        },
        meta: {
          ip: "::ffff:127.0.0.1",
        },
      },
      included: [getFactoryObject(users)(1), ...getFactoryObjects(votes)([1, 2])],
    },
    articlesAndArticlesVotsOf2ndUser: {
      data: {
        ...getFactoryObject(users)(2),
        relationships: {
          ...getExtraRelationships(articles, "articles")([2, 3]),
        },
      },
      included: [...getFactoryObjects(articles)([2, 3]), getFactoryObject(votes)(3)],
    },
    parentCommentAndParentCommentsAuthorOf1stComment: {
      data: getFactoryObject(comments)(1),
      included: [getFactoryObject(comments)(2), getFactoryObject(users)(2)],
    },
    parentCommentAndParentCommentsParentCommentOf1stComment: {
      data: getFactoryObject(comments)(1),
      included: [getFactoryObject(comments)(2), getFactoryObject(comments)(3)],
    },
  },
};
