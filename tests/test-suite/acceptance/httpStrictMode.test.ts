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

      it("Random endpoint with correct content-type with params", async () => {
        // Add JSON:API media type with params (ext)
        request.set("Content-Type", 'application/vnd.api+json; ext="https://jsonapi.org/ext/version"');
        const result = await request.get("/random/number");

        expect(result.status).toEqual(200);
        expect(result.body.data.attributes).toHaveProperty("randomNumber");
        expect(result.body.data.attributes.randomNumber).toBeGreaterThan(0);
      });

      // TODO: Check valid JSON:API media type params (https://jsonapi.org/format/#media-type-parameter-rules)
    });
  });
});
