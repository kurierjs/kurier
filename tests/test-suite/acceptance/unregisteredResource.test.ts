import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Foobar (Unregistered resource)", () => {
    describe("GET", () => {
      it("Get Foobar - Unregistered resource", async () => {
        const result = await request.get("/foobar");
        expect(result.status).toEqual(400);
        expect(result.body.errors[0]).toEqual({
          code: "bad_request",
          status: 400,
          detail: "Resource foobar is not registered in the API Application",
        });
      });

      it("Get Foobar with ID 123 - Unregistered resource", async () => {
        const result = await request.get("/foobar/123");
        expect(result.status).toEqual(400);
        expect(result.body.errors[0]).toEqual({
          code: "bad_request",
          status: 400,
          detail: "Resource foobar is not registered in the API Application",
        });
      });

      it("Post Foobar - Unregistered resource", async () => {
        const result = await request.post("/foobar");
        expect(result.status).toEqual(400);
        expect(result.body.errors[0]).toEqual({
          code: "bad_request",
          status: 400,
          detail: "Resource foobar is not registered in the API Application",
        });
      });

      it("Patch Foobar ID 123 - Unregistered resource", async () => {
        const result = await request.patch("/foobar/123");
        expect(result.status).toEqual(400);
        expect(result.body.errors[0]).toEqual({
          code: "bad_request",
          status: 400,
          detail: "Resource foobar is not registered in the API Application",
        });
      });

      it("Delete Foobar ID 123 - Unregistered resource", async () => {
        const result = await request.del("/foobar/123");
        expect(result.status).toEqual(400);
        expect(result.body.errors[0]).toEqual({
          code: "bad_request",
          status: 400,
          detail: "Resource foobar is not registered in the API Application",
        });
      });
    });
  });
});
