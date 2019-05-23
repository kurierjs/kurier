import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import factory from "./factories/article";
import context from "../transaction";
import http from "../dummy/src/http";
import app from "../dummy/src/app";
import Article from "../dummy/src/resources/article";

const request = agent(http) as SuperTest<Test>;

describe("Articles", () => {
  describe("GET", () => {
    it("Show articles index", async () => {
      const data = JSON.parse(JSON.stringify(factory.toInsert[0]));
      const rawArticle = app.serializer.deserializeResource({ op: "add", data, ref: { type: "article" } }, Article);
      await context.transaction.table("articles").insert(rawArticle.data.attributes);

      const result = await request.get(`/articles`);

      expect(result.status).toEqual(200);
    });

    it("Gets article by id", async () => {
      const data = JSON.parse(JSON.stringify(factory.toInsert[0]));
      const rawArticle = app.serializer.deserializeResource({ op: "add", data, ref: { type: "article" } }, Article);
      await context.transaction.table("articles").insert(rawArticle.data.attributes);

      const result = await request.get(`/articles/1`);
      const {
        relationships, type,
        attributes: { body }
      } = factory.toInsert[0];
      const mockedResult = { relationships, type, id: 1, attributes: { body, voteCount: 0 } };

      expect(result.status).toEqual(200);
      expect(result.body.data).toEqual(mockedResult);
    });
  });
});
