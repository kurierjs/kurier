import articles from "./factories/article";
import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer from "./helpers/transportLayers";
import nested from "./factories/nested";

const request = testTransportLayer("koa");

describe("Articles", () => {
  describe("GET", () => {
    it("Get 1st vote articles", async () => {
      const result = await request.get(`/articles/1/votes`);
      expect(result.body).toEqual(nested.get.votesOf1stArticle);
      expect(result.status).toEqual(200);
    });
  });
});
