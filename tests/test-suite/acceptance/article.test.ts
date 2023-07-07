import { EagerLoadedData } from './../../../dist/types.d';
import articles from "./factories/article";
import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Articles", () => {
    describe("GET", () => {
      it("Get all articles", async () => {
        const result = await request.get(`/articles`);
        expect(result.body).toEqual({ data: articles.toGet.response });
        expect(result.status).toEqual(200);
      });

      it("Gets article by id", async () => {
        const result = await request.get(`/articles/1`);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: articles.toGet.response[0] });
      });

      it("Search Article by %like - Should return all Articles", async () => {
        const result = await request.get("/articles?filter[body]=like:%test%");
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: articles.toGet.response });
      });

      it("Search Article by %like - Should return empty", async () => {
        const result = await request.get("/articles?filter[body]=like:this%|like:%this");
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: [] });
      });

      it("Search Article by %like - Should return the first Article", async () => {
        const result = await request.get("/articles?filter[body]=like:%1");
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: [articles.toGet.response[0]] });
      });

      it("Search Article by VoteCount - Should return the first Article", async () => {
        const result = await request.get("/articles?filter[voteCount]=ge:2");
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: [articles.toGet.response[0]] });
      });

      it("Authenticated - Get an specific article with it's votes and author - Multiple types include", async () => {
        const authData = await getAuthenticationData();
        const result = await request.get("/articles/1?include=author,votes").set("Authorization", authData.token);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(articles.singleArticleMultipleIncludes);
      });

      it("UNAuthenticated - Get an specific article with it's author - Should not include author", async () => {
        const result = await request.get("/articles/1?include=author");
        expect(result.body.included).toEqual(undefined);
      });

      it("Meta - Get meta hooks response", async () => {
        const result = await request.get("/articles");
        expect(result.body.data[0].meta).toEqual({
          hello: "world",
        });
      });

      it("Meta - meta hooks response in GET ALL", async () => {
        const result = await request.get("/articles");
        expect(result.body.data[0].meta).toEqual({
          hello: "world",
        });
      });

      it("Meta - meta hooks response in GET by ID", async () => {
        const result = await request.get("/articles/1");
        expect(result.body.data.meta).toEqual({
          hello: "world",
        });
      });

      it("Get articles with included votes", async () => {
        const result = await request.get("/articles?include=votes");
        expect(result.body).toEqual(articles.multipleArticlesIncludedVotes);
      });
    });
  });
});