import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import articles from "./factories/article";
import context from "../transaction";
import http from "../test-app/http";
import Article from "../test-app/resources/article";
import deserializer from "./helpers/deserializer";

const request = agent(http) as SuperTest<Test>;

describe("Articles", () => {
  describe("GET", () => {
    beforeEach(async () => {
      const article = deserializer(articles.toGet.request[0], Article, "add");
      await context.transaction.table("articles").insert(article.data.attributes);
    });

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
