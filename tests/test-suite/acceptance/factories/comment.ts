export default {
  forCreation: {
    requests: {
      jsonapi: {
        data: {
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam"
          },
          relationships: {
            parentComment: {
              data: {
                id: 1,
                type: "comment"
              }
            },
            author: {
              data: {
                id: 2,
                type: "user"
              }
            }
          }
        }
      },
      rawRequest: {
        data: {
          attributes: {
            body: "new commentttt",
            type: "spam",
            parent_comment_id: 1,
            author_id: 2
          }
        }
      }
    },
    responses: {
      complete: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam"
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
                id: 1,
                type: "comment"
              }
            }
          }
        }
      },
      responseNoBody: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: null,
            type: "spam"
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
                id: 1,
                type: "comment"
              }
            }
          }
        }
      },
      responseNoParentComment: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user"
              }
            },
            parentComment: {
              data: null
            }
          }
        }
      }
    }
  },
  toUpdate: {
    attributeAndRelationship: {
      request: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam"
          },
          relationships: {
            parentComment: {
              data: {
                id: 2,
                type: "comment"
              }
            },
            author: {
              data: {
                id: 2,
                type: "user"
              }
            }
          }
        }
      },
      response: {
        data: {
          id: 2,
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam"
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
                id: 2,
                type: "comment"
              }
            }
          }
        }
      }
    },
    removeRelationship: {
      request: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam"
          },
          relationships: {
            parentComment: {
              data: {
                id: null,
                type: "comment"
              }
            },
            author: {
              data: {
                id: 2,
                type: "user"
              }
            }
          }
        }
      },
      requestForError: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam"
          },
          relationships: {
            parentComment: {
              data: {
                id: 1,
                type: "comment"
              }
            },
            author: {
              data: {
                id: null,
                type: "user"
              }
            }
          }
        }
      },
      response: {
        data: {
          id: 2,
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user"
              }
            },
            parentComment: {
              data: null
            }
          }
        }
      }
    }
  },
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
