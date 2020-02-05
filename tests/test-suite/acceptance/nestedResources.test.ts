import articles from "./factories/article";
import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer from "./helpers/transportLayers";
import nested from "./factories/nested";

const request = testTransportLayer("koa");

describe("Articles", () => {

  describe("GET", () => {
    it("Get 1st article votes (hasMany)(Multiple Results)", async () => {
      const result = await request.get(`/articles/1/votes`);
      expect(result.body).toEqual(nested.get.votesOf1stArticle);
      expect(result.status).toEqual(200);
    });
  });

  describe("GET", () => {
    it("Get 2nd article vote (hasMany)(empty)", async () => {
      const result = await request.get(`/articles/2/votes`);
      expect(result.body).toEqual(nested.get.votesOf2ndArticle);
      expect(result.status).toEqual(200);
    });
  });

  describe("GET", () => {
    it("Get 3rd article vote (hasMany)(Single Result)", async () => {
      const result = await request.get(`/articles/3/votes`);
      expect(result.body).toEqual(nested.get.votesOf3rdArticle);
      expect(result.status).toEqual(200);
    });
  });
  
  describe("GET", () => {
    it("Get 1st vote article (BelongsTo)", async () => {
      const result = await request.get(`/votes/1/article`);
      expect(result.body).toEqual(nested.get.articleOf1stVote);
      expect(result.status).toEqual(200);
    });
  });

});
