import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import articles from "./factories/article";
import http from "../test-app/http";

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
  });
});
