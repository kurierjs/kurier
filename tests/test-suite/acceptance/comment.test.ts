import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import comments from "./factories/comment";
import http from "../test-app/http";

const request = agent(http) as SuperTest<Test>;

describe("Comments", () => {
  describe("GET", () => {
    it("Get Comment - Test field filter - Should show only the body attribute", async () => {
      const result = await request.get("/comments/1?fields[comment]=body");
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(comments.singleArticleNoTypeField);
    });

    it("List Comments - Test sorting - Should be sorted by body field", async () => {
      const result = await request.get("/comments?sort=-body");
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(comments.toGetReverseSorted);
    });

    it("List Comments - Test pagination - Should only show one", async () => {
      const result = await request.get("/comments?page[number]=0&page[size]=1");
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ data: [comments.toGetReverseSorted.data[2]] });
    });
  });
});
