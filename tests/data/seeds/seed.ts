exports.seed = (knex, Promise) => {
  return knex("articles")
    .del()
    .then(() => {
      return knex("users")
        .insert([
          { id: 1, username: "me", email: "me@me.com", password: "test" },
          { id: 2, username: "username2", email: "me2@me.com", password: "test" },
          { id: 3, username: "username3", email: "me3@me.com", password: "test" }
        ])
        .then(() => {
          return knex("articles")
            .insert([
              { id: 1, body: "this is test 1", author: 1 },
              { id: 2, body: "this is test 2", author: 2 },
              { id: 3, body: "this is test 3", author: 2 }
            ])
            .then(() => {
              return knex("votes")
                .insert([
                  { _Id: 1, points: 10, author: "1", article_id: "1" },
                  { _Id: 2, points: 2, author: "1", article_id: "1" },
                  { _Id: 3, points: 8, author: "3", article_id: "3" }
                ])
                .then(() => { });
            });
        });
    });
};
