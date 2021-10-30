import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Random", () => {
    describe("GET", () => {
      it("Get Random - Test non-knex Operation - Should get a random number", async () => {
        const result = await request.get("/random/number");
        expect(result.status).toEqual(200);
        expect(result.body.data.attributes).toHaveProperty("randomNumber");
        expect(result.body.data.attributes.randomNumber).toBeGreaterThan(0);
      });

      it("Get Random - Test non-knex Operation - Should get a random string", async () => {
        const result = await request.get("/random/string");
        expect(result.status).toEqual(200);
        expect(result.body.data.attributes).toHaveProperty("randomString");
        expect(result.body.data.attributes.randomString.length).toBeGreaterThan(0);
      });

      it("Get Random - Test non-knex Operation - Should get a random date", async () => {
        const result = await request.get("/random/date");
        expect(result.status).toEqual(200);
        expect(result.body.data.attributes).toHaveProperty("randomDate");
        expect(result.body.data.attributes.randomDate.length).toEqual(24);
        expect(result.body.data.attributes.randomDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/g);
      });
    });
  });
});
