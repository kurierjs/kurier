export const articles = [{
  "id": 1,
  "type": "article",
  "attributes": {
    "body": "this is test 1",
    "voteCount": 2
  },
  "relationships": {
    "author": {
      "data": {
        "id": 1,
        "type": "user"
      }
    }
  }
},
{
  "id": 2,
  "type": "article",
  "attributes": {
    "body": "this is test 2",
    "voteCount": 0
  },
  "relationships": {
    "author": {
      "data": {
        "id": 2,
        "type": "user"
      }
    }
  }
},
{
  "id": 3,
  "type": "article",
  "attributes": {
    "body": "this is test 3",
    "voteCount": 1
  },
  "relationships": {
    "author": {
      "data": {
        "id": 2,
        "type": "user"
      }
    }
  }
}]

export default {
  toGet: {
    response: [
      {
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 2
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 1, type: "user" }
          }
        }
      },
      {
        id: 2,
        attributes: {
          body: "this is test 2",
          voteCount: 0
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" }
          }
        }
      },
      {
        id: 3,
        attributes: {
          body: "this is test 3",
          voteCount: 1
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" }
          }
        }
      }
    ]
  },
  singleArticleMultipleIncludes: {
    data: {
      id: 1,
      type: "article",
      attributes: {
        body: "this is test 1",
        voteCount: 2
      },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user"
          }
        },
        votes: {
          data: [
            {
              id: 1,
              type: "vote"
            },
            {
              id: 2,
              type: "vote"
            }
          ]
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
          coolFactor: 3,
          friends: [
              {
                "name": "Joel",
              },
              {
                "name": "Ryan",
              },
            ],
          roles: [
              "user",
              "author",
              "voter",
            ],
        },
        relationships: {}
      },
      {
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
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
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
      }
    ]
  }
};
