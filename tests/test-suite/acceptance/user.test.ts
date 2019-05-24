import { SuperTest, Test } from "supertest";
import * as agent from "supertest-koa-agent";
import users from "./factories/user";
import context from "../transaction";
import http from "../test-app/http";
import getAuthenticationData from "./helpers/authenticateUser";

const request = agent(http) as SuperTest<Test>;

describe("Users", () => {
  describe("POST", () => {
    it("Create user", async () => {
      const result = await request.post("/users").send(users.forCreation.initial)
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(users.forCreation.final);
    });
  });

  describe("PATCH", () => {
    it("Update a user", async () => {
      const [insertedId] = await context.transaction.table("users").insert(users.toUpdate.initial.data.attributes);
      const result = await request.patch(`/users/${insertedId}`).send(users.toUpdate.dataToUpdate)
      expect(result.body).toEqual(users.toUpdate.final);
      expect(result.status).toEqual(200);
    });
  });

  describe("GET", () => {
    it("Session Creation", async () => {
      await request.post("/users").send(users.toAuthenticate.user);
      const result = await request.post("/session").send(users.toAuthenticate.initial);
      expect(result.status).toEqual(201);
      expect(result.body.data.id).toBeDefined();
      expect(result.body.data.attributes.token).toBeDefined();
      expect(result.body.data.type).toEqual("session");
      expect(result.body.data.relationships).toEqual(users.toAuthenticate.final.data.relationships);
    });

    it("Authenticated - Get all users", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get("/users").set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ data: users.toGet });
    });

    it("Authenticated - Gets current user by id", async () => {
      const authData = await getAuthenticationData();
      const result = await request.get(`/users/${authData.user.id}`).set("Authorization", authData.token);
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ data: users.toGet[0] });
    });

  });
});
