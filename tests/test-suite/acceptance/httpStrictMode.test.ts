import getAuthenticationData from "./helpers/authenticateUser";

import testTransportLayer, { testTransportLayerWithStrictError, transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const requestWithError = testTransportLayerWithStrictError(transportLayer);
  const request = testTransportLayer(transportLayer);
  describe("Test transport layer", () => {
    describe("Request without application/vnd.api+json content-type", () => {
      it("Random endpoint with wrong content-type", async () => {
        const authData = await getAuthenticationData();
        const result = await requestWithError.get("/users").set("Authorization", authData.token);
        expect(result.status).toEqual(400);
        expect(JSON.stringify(result.body)).toMatch("Content-Type must be application/vnd.api+json");
      });
    });

    describe("Request with application/vnd.api+json content-type", () => {
      it("Random endpoint with correct content-type", async () => {
        const result = await request.get("/random/number");
        expect(result.status).toEqual(200);
        expect(result.body.data.attributes).toHaveProperty("randomNumber");
        expect(result.body.data.attributes.randomNumber).toBeGreaterThan(0);
      });
    });
  });
});
