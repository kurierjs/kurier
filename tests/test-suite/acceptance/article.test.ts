import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import articles from "./factories/article";
import http from "../test-app/http";
import getAuthenticationData from "./helpers/authenticateUser";

const request = agent(http) as SuperTest<Test>;

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

    it("Authenticated - Get an specific article with it's votes and author - Multiple types include", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/articles/1?include=author,votes").set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(articles.singleArticleMultipleIncludes);
    });

    // TODO: THIS SHOULD'NT WORK WELL - EITHER 401 or simply don't show the author
    it("UNAuthenticated - Get an specific article with it's author - Should fail", async () => {
      const result = await request.get("/articles/1?include=author");
      expect(result.status).toEqual(401);
    });
  });
});
