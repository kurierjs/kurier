export default {
  toGetReverseSorted: {
    data: [
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
        id: 2,
        type: "comment",
        attributes: {
          body: "hello2",
          type: "not_spam"
        },
        relationships: {
          author: {
            data: {
              id: 2,
              type: "user"
            }
          },
          parentComment: {
            data: {
              id: 3,
              type: "comment"
            }
          }
        }
      },
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
      }
    ]
  },
  singleArticleNoTypeField: {
    data: {
      id: 1,
      type: "comment",
      attributes: {
        body: "hello"
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
    }
  }
};
