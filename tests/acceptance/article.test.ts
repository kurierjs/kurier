import * as faker from "faker";
import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import factory from "./factories/article";
import context from "../transaction";
import http from "../dummy/src/http";

const request = agent(http) as SuperTest<Test>;

describe("Articles", () => {
  describe("GET", () => {
    it("Show articles index", async () => {
      const factoryData = factory.buildList(faker.random.number({ min: 3, max: 10 }));
      await context.transaction.table("articles").insert(factoryData);
      const dbResources = await context.transaction.table("articles").select("*");

      const result = await request.get(`/articles`);

      expect(result.status).toEqual(200);
      expect(result.body.data.length).toEqual(dbResources.length);

      dbResources.forEach(dbRecord => {
        const requestResult = result.body.data.find(a => a.id === dbRecord.id);

        expect(requestResult).not.toBeUndefined();
        expect(requestResult.attributes.body).toEqual(dbRecord.body);
      });
    });

    it("Gets article by id", async () => {
      const factoryData = factory.buildList(faker.random.number({ min: 3, max: 10 }));
      await context.transaction.table("articles").insert(factoryData);
      const dbResources = await context.transaction.table("articles").select("*");
      const dbRecord: any = faker.random.arrayElement(dbResources);

      const result = await request.get(`/articles/${dbRecord.id}`);

      expect(result.status).toEqual(200);
      const requestResult = result.body.data;
      expect(requestResult).not.toBeUndefined();
      expect(requestResult.attributes.body).toEqual(dbRecord.body);
    });
  });
});
