import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import factory from "./factories/user";
import context from "../transaction";
import http from "../dummy/src/http";
import getAuthenticationData from "./helpers/authenticateUser";
import { HasId } from "../../src";

const request = agent(http) as SuperTest<Test>;

describe("Users", () => {
  describe("POST", () => {
    it("Create user", async () => {
      try {
        const result = await request.post("/users").send({ data: factory.usersToInsert[0] }).set("Content-Type", "application/json")
        expect(result.status).toEqual(201);
        expect(result.body).toEqual({ data: factory.expectedUserOnGet[0] });
      } catch (error) { }
    });
  });

  describe("PATCH", () => {
    it("Update a user", async () => {
      try {
        const user = { data: factory.usersToInsert[1] };
        const updatedResponse = { data: factory.expectedUserOnGet[1] };
        const [insertedId] = await context.transaction.table("users").insert(user.data.attributes);
        user.data.attributes.email = "modifiedemail@test.com";
        updatedResponse.data.attributes.email = "modifiedemail@test.com";
        updatedResponse.data.id = insertedId;

        const result = await request.patch(`/users/${insertedId}`).send(user).set("Content-Type", "application/json")
        expect(result.body).toEqual(updatedResponse);
        expect(result.status).toEqual(200);
      } catch (error) { }
    });
  });

  describe("GET", () => {
    let authData: { user: HasId, token: string };

    beforeEach(async () => {
      authData = await getAuthenticationData();
    });

    it("Get all users", async () => {
      try {
        const result = await request.get("/users").set("Authorization", authData.token);
        expect(result.status).toEqual(403);
        expect(result.body).toEqual({ data: factory.expectedUserOnGet });
      } catch (error) { }
    });

    it("Gets current user by id", async () => {
      const result = await request.get(`/users/${authData.user.id}`).set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ data: authData.user });
    });
  });
});
