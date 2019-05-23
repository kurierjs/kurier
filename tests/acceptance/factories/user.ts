export default {
  usersToInsert: [
    {
      attributes: {
        email: "test@test.com",
        password: "test",
        username: 123456
      },
      type: "user",
      relationships: {}
    },
    {
      attributes: {
        email: "test2@test.com",
        password: "test2",
        username: "testest"
      },
      type: "user",
      relationships: {}
    }

  ],
  expectedUserOnGet: [
    {
      id: 1,
      type: "user",
      attributes: {
        username: "123456",
        email: "test@test.com",
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
        username: "testest",
        email: "test2@test.com",
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"]
      },
      relationships: {}
    }
  ]
};
