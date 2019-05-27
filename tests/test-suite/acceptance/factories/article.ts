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
            data: { id: "1", type: "user" }
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
            data: { id: "2", type: "user" }
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
            data: { id: "2", type: "user" }
          }
        }
      }
    ]
  }
};
