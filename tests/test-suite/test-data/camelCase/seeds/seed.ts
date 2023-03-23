exports.seed = (knex) => {
  const initialData = [
    {
      tableName: "users",
      values: [
        { id: 1, username: "me", email: "me@me.com", password: "test", location: "-10.24,-10.25" },
        { id: 2, username: "username2", email: "me2@me.com", password: "test", location: "-10.26,-10.27" },
        { id: 3, username: "username3", email: "me3@me.com", password: "test", location: "-10.28,-10.29" },
      ],
    },
    {
      tableName: "articles",
      values: [
        { id: 1, body: "this is test 1", author: 1 },
        { id: 2, body: "this is test 2", author: 2 },
        { id: 3, body: "this is test 3", author: 2 },
      ],
    },
    {
      tableName: "votes",
      values: [
        { _Id: 1, points: 10, userId: 1, articleId: 1 },
        { _Id: 2, points: 2, userId: 1, articleId: 1 },
        { _Id: 3, points: 8, userId: 3, articleId: 3 },
      ],
    },
    {
      tableName: "comments",
      values: [
        { _id: 1, body: "hello", type: "not_spam", author_id: 1, parentCommentId: 2 },
        { _id: 2, body: "hello2", type: "not_spam", author_id: 2, parentCommentId: 3 },
        { _id: 3, body: "hello3", type: "spam", author_id: 1 },
      ],
    },
  ];
  return Promise.all(initialData.map(({ tableName, values }) => knex(tableName).insert(values))).then(() => {});
};
