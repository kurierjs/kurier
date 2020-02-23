import testTransportLayer from "./helpers/transportLayers";
import getAuthenticationData from "./helpers/authenticateUser";
import nested from "./factories/nestedResources";

const request = testTransportLayer("koa");

describe("Nested Resources", () => {

  describe("GET", () => {
    it("Get 1st article'Author and his Votes (hasMany)(Multiple Results)", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/articles/1?include=author.votes")
        .set("Authorization", authData.token);
      expect(result.status).toEqual(200);
    });
  });

});
