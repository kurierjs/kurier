import * as faker from "faker";
import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import factory from "./factories/user";
import context from "../transaction";
import http from "../dummy/src/http";
import createUser from "./helpers/create-user";
import createSessionToken from "./helpers/create-session-token";
import User from "../dummy/src/resources/user";

const request = agent(http) as SuperTest<Test>;

describe("Users", () => {
  let currentUser: User;
  let token: string;

  beforeEach(async () => {
    currentUser = await createUser();
    token = await createSessionToken(currentUser.attributes.email as string, currentUser.attributes.password as string);
  });

  describe("GET", () => {
    it("Show users index", async () => {
      try {
        const factoryData = factory.buildList(faker.random.number({ min: 3, max: 10 }));
        await context.transaction.table("users").insert(factoryData);

        const result = await request.get("/users")
          .set("Authorization", token)

        expect(result.status).toEqual(403);
      } catch (error) {}
    });

    it("Gets user by id", async () => {
      const factoryData = factory.buildList(faker.random.number({ min: 3, max: 10 }));
      await context.transaction.table("users").insert(factoryData);

      const result = await request.get(`/users/${currentUser.id}`).set("Authorization", token);

      expect(result.status).toEqual(200);
      const requestResult = result.body.data;
      expect(requestResult).not.toBeUndefined();
      expect(requestResult.attributes.email).toEqual(currentUser.attributes.email);
      expect(requestResult.attributes.username).toEqual(currentUser.attributes.username);
    });
  });
});
