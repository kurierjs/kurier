import testTransportLayer from "./helpers/transportLayers";
import getAuthenticationData from "./helpers/authenticateUser";
import nested from "./factories/nestedResources";

const request = testTransportLayer("koa");

describe("Nested Resources", () => {

  describe("GET", () => {
    it("Get the 1st article'Author and his Votes (*-1-*)", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/articles/1?include=author.votes")
        .set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(nested.get.authorAndAuthorVotesOf1stArticle);
    });

    it("Get the 2nd User's articles and their Votes (1-*-*)", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/users/2?include=articles.votes")
        .set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(nested.get.articlesAndArticlesVotsOf2ndUser);
    });

    it("Get the 1nd Comment parent's Comment's author (1-1-*)", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/comment/1?include=parentComment.author")
        .set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(nested.get.parentCommentAndParentCommentsAuthorOf1stComment);
    });

    it("Get the 1nd Comment's parent's comment parent's comment (1-1-1)", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/comment/1?include=parentComment.parentComment")
        .set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(nested.get.parentCommentAndParentCommentsParentCommentOf1stComment);
    });
  });

});
