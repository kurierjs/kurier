import users from "./factories/user";
import getAuthenticationData from "./helpers/authenticateUser";

import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Users", () => {
    describe("GET", () => {
      it("Authenticated - Get all users", async () => {
        const authData = await getAuthenticationData();
        const result = await request.get("/users").set("Authorization", authData.token);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: users.toGet });
      });

      it("Authenticated - Get all users with their votes and comments - Multiple types include", async () => {
        const authData = await getAuthenticationData();
        const result = await request
          .get("/users/1?include=comments,articles,votes")
          .set("Authorization", authData.token);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(users.multipleIncludeGetSingleUser);
      });

      it("Authenticated - Get a user by it's email - equality filter", async () => {
        const authData = await getAuthenticationData();
        const result = await request.get("/users?filter[email]=me@me.com").set("Authorization", authData.token);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual({ data: [users.toGet[0]] });
      });
    });

    describe("POST", () => {
      it("Create user", async () => {
        const result = await request.post("/users").send(users.forCreation.request);
        expect(result.status).toEqual(201);
        expect(result.body).toEqual(users.forCreation.response);
      });
    });

    describe("PATCH", () => {
      it("Update a user", async () => {
        const result = await request.patch(`/users/2`).send(users.toUpdate.dataToUpdate);
        expect(result.body).toEqual(users.toUpdate.response);
        expect(result.status).toEqual(200);
      });
    });

    describe("DELETE", () => {
      it("Delete a user", async () => {
        const authData = await getAuthenticationData();
        const deleteResponse = await request.delete("/users/2");
        const emptyResponse = await request.get("/users/2").set("Authorization", authData.token);
        expect(deleteResponse.status).toEqual(204);
        expect(emptyResponse.status).toEqual(404);
        expect(emptyResponse.body).toEqual(users.deletedUserError);
      });
    });
  });
});
