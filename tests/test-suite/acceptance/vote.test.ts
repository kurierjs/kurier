import vote from "./factories/vote";
import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer, {transportLayers} from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
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
});
