import { getFactoryObject } from "./utils";

const votes = [
  {
    "id": 1,
    "type": "vote",
    "attributes": {
      "points": 10,
      "createdOn": null,
      "updatedOn": null,
      "updatedBy": null,
      "createdBy": null
    },
    "relationships": {
      "user": {
        "data": {
          "id": 1,
          "type": "user"
        }
      },
      "article": {
        "data": {
          "id": 1,
          "type": "article"
        }
      }
    }
  },
  {
    "id": 2,
    "type": "vote",
    "attributes": {
      "points": 2,
      "createdOn": null,
      "updatedOn": null,
      "updatedBy": null,
      "createdBy": null
    },
    "relationships": {
      "user": {
        "data": {
          "id": 1,
          "type": "user"
        }
      },
      "article": {
        "data": {
          "id": 1,
          "type": "article"
        }
      }
    }
  },
  {
    "id": 3,
    "type": "vote",
    "attributes": {
      "points": 8,
      "createdOn": null,
      "updatedOn": null,
      "updatedBy": null,
      "createdBy": null
    },
    "relationships": {
      "user": {
        "data": {
          "id": 3,
          "type": "user"
        }
      },
      "article": {
        "data": {
          "id": 3,
          "type": "article"
        }
      }
    }
  }
];


const getVote = getFactoryObject(votes, 'id');
const results = {
  toGetIncludedUserAndArticle: {
    data: getVote(1),
    included: [
      {
        id: 1,
        type: "user",
        attributes: {
          username: "me",
          email: "me@me.com",
          createdAt: null,
          updatedAt: null
        },
        relationships: {}
      },
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          createdAt: null,
          updatedAt: null
        },
        relationships: {
          author: {
            data: {
              id: 1,
              type: "user"
            }
          }
        }
      }
    ]
  }
};

export { votes, results };
export default results;