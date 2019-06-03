export default {
  toGetIncludedUserAndArticle: {
    data: {
      id: 1,
      type: "vote",
      attributes: {
        points: 10,
        createdOn: null,
        updatedOn: null,
        updatedBy: null,
        createdBy: null
      },
      relationships: {
        user: {
          data: {
            id: 1,
            type: "user"
          }
        },
        article: {
          data: {
            id: 1,
            type: "article"
          }
        }
      }
    },
    included: [
      {
        id: 1,
        type: "user",
        attributes: {
          username: "me",
          email: "me@me.com",
          createdAt: null,
          updatedAt: null
        },
        relationships: {}
      },
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          createdAt: null,
          updatedAt: null
        },
        relationships: {
          author: {
            data: {
              id: 1,
              type: "user"
            }
          }
        }
      }
    ]
  }
};
