export default {
  toGet: {
    initial: [
      {
        attributes: {
          body: "this is test 1"
        },
        type: "article",
        relationships: {
          author: {
            data: { id: "1", type: "user" }
          }
        }
      }
    ],
    loaded: [
      {
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 0
        },
        type: "article",
        relationships: {
          author: {
            data: { id: "1", type: "user" }
          }
        }
      }
    ]
  }
};
