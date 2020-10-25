export const users = [{
  "id": 1,
  "type": "user",
  "attributes": {
    "username": "me",
    "email": "me@me.com",
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
},
{
  "id": 2,
  "type": "user",
  "attributes": {
    "username": "username2",
    "email": "me2@me.com",
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
},
{
  "id": 3,
  "type": "user",
  "attributes": {
    "username": "username3",
    "email": "me3@me.com",
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
}];


export const usersWithCreatedAt = [{
  "id": 1,
  "type": "user",
  "attributes": {
    "username": "me",
    "email": "me@me.com",
    "createdAt": null,
    "updatedAt": null,
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
},
{
  "id": 2,
  "type": "user",
  "attributes": {
    "username": "username2",
    "email": "me2@me.com",
    "createdAt": null,
    "updatedAt": null,
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
},
{
  "id": 3,
  "type": "user",
  "attributes": {
    "username": "username3",
    "email": "me3@me.com",
    "friends": [
      {
        "name": "Joel"
      },
      {
        "name": "Ryan"
      }
    ],
    "coolFactor": 3,
    "roles": [
      "user",
      "author",
      "voter"
    ]
  },
  "relationships": {}
}];

export default {
  forCreation: {
    request: {
      data: {
        attributes: {
          email: "creationtest@test.com",
          password: "test",
          username: "creationtest"
        },
        type: "user",
        relationships: {}
      }
    },
    response: {
      data: {
        id: 4,
        type: "user",
        attributes: {
          username: "creationtest",
          email: "creationtest@test.com",
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"]
        },
        relationships: {}
      }
    }
  },
  toUpdate: {
    dataToUpdate: {
      data: {
        type: "user",
        attributes: {
          email: "updatetest@test.com"
        }
      }
    },
    response: {
      data: {
        id: 2,
        type: "user",
        attributes: {
          username: "username2",
          email: "updatetest@test.com",
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"]
        },
        relationships: {}
      }
    }
  },
  toAuthenticate: {
    request: {
      data: {
        attributes: {
          email: "me@me.com",
          password: "test"
        },
        type: "session",
        relationships: {}
      }
    },
    response: {
      data: {
        id: "STRING",
        type: "session",
        attributes: {
          token: "STRING"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user"
            }
          }
        }
      }
    }
  },
  toGet: [
    // the first element here is the authenticated user
    {
      id: 1,
      type: "user",
      attributes: {
        email: "me@me.com",
        username: "me",
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {}
    },
    {
      id: 2,
      type: "user",
      attributes: {
        email: "me2@me.com",
        username: "username2",
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {}
    },
    {
      id: 3,
      type: "user",
      attributes: {
        email: "me3@me.com",
        username: "username3",
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {}
    }
  ],
  multipleIncludeGetSingleUser: {
    data: {
      id: 1,
      type: "user",
      attributes: {
        username: "me",
        email: "me@me.com",
        friends: [
          {
            name: "Joel"
          },
          {
            name: "Ryan"
          }
        ],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {
        comments: {
          data: [
            {
              id: 1,
              type: "comment"
            },
            {
              id: 3,
              type: "comment"
            }
          ]
        },
        articles: {
          data: [
            {
              id: 1,
              type: "article"
            }
          ]
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
        type: "comment",
        attributes: {
          body: "hello",
          type: "not_spam"
        },
        relationships: {
          author: {
            data: {
              id: 1,
              type: "user"
            }
          },
          parentComment: {
            data: {
              id: 2,
              type: "comment"
            }
          }
        }
      },
      {
        id: 3,
        type: "comment",
        attributes: {
          body: "hello3",
          type: "spam"
        },
        relationships: {
          author: {
            data: {
              id: 1,
              type: "user"
            }
          },
          parentComment: {
            data: null
          }
        }
      },
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          createdAt: null,
          updatedAt: null,
          voteCount: 2
        },
        relationships: {
          author: {
            data: {
              id: 1,
              type: "user"
            }
          }
        }
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
  },
  deletedUserError: {
    errors: [
      {
        code: "not_found",
        status: 404
      }
    ]
  }
};
