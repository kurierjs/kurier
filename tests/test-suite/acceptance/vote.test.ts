import vote from "./factories/vote";
import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer from "./helpers/transportLayers";

const request = testTransportLayer("koa");

describe("Votes", () => {
  describe("GET", () => {
    it("Gets vote by id", async () => {
      const { token } = await getAuthenticationData();
      const result = await request.get(`/votes/1?include=user,article`).set("Authorization", token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(vote.toGetIncludedUserAndArticle);
    });
  });
});
