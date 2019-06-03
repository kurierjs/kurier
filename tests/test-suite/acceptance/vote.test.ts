import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import vote from "./factories/vote";
import http from "../test-app/http";
import getAuthenticationData from "./helpers/authenticateUser";

const request = agent(http) as SuperTest<Test>;

describe("Votes", () => {
  describe("GET", () => {
    it("Gets vote by id", async () => {
      const { token } = await getAuthenticationData();
      const result = await request.get(`/votes/1?include=user,article`).set("Authorization", token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(vote.toGetIncludedUserAndArticle);
    });
  });
});
