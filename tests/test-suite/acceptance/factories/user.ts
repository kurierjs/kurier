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
  ]
};
