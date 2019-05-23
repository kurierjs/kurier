export default {
  toInsert: [
    {
      attributes: {
        body: "this is test 1",
      },
      type: "article",
      relationships: {
        author: {
          data: { id: "1", type: "user" }
        }
      }
    },
    {
      attributes: {
        body: "this is test 2",
      },
      type: "article",
      relationships: {
        author: {
          data: { id: "1", type: "user" }
        }
      }
    },
  ]
};
