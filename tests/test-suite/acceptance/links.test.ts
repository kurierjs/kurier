import pagination from "./factories/links";
import testTransportLayer from "./helpers/transportLayers";

const request = testTransportLayer("koa");

describe("Links", () => {
  it("Links - Get all comments - Should contain links in response", async () => {
    const result = await request.get("/links?page[number]=0&page[size]=1");
    expect(result.status).toEqual(200);
    expect(result.body).toEqual(pagination.toGet.response);
  });
});
