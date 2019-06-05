import comments from "./factories/comment";
import testTransportLayer from "./helpers/transportLayers";

const request = testTransportLayer("express");

describe("Comments", () => {
  describe("GET", () => {
    it("Get Comment - Test field filter - Should show only the body attribute", async () => {
      const result = await request.get("/comments/1?fields[comment]=body");
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(comments.singleCommentNoType);
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

    it("List Comments - Test pagination - Should only show one", async () => {
      const result = await request.get("/comments/1?include=parentComment");
      expect(result.status).toEqual(200);
      expect(result.body).toEqual(comments.singleCommentWithReflexiveInclude);
    });
  });

  describe("POST", () => {
    it("Create comment - raw request", async () => {
      const data =
        global["TEST_SUITE"] === "test_camelCase"
          ? comments.forCreation.requests.rawRequestCamelCase
          : comments.forCreation.requests.rawRequestSnakeCase;
      const result = await request.post("/comments").send(data);
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(comments.forCreation.responses.complete);
    });

    it("Create comment - Jsonapi request", async () => {
      const result = await request.post("/comments").send(comments.forCreation.requests.jsonapi);
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(comments.forCreation.responses.complete);
    });

    it("Create comment - missing attribute - should have a null attribute", async () => {
      const payload = JSON.parse(JSON.stringify(comments.forCreation.requests.jsonapi));
      delete payload.data.attributes.body;
      const result = await request.post("/comments").send(payload);
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(comments.forCreation.responses.responseNoBody);
    });

    it("Create comment - missing relationship - should have a null data property in the missing relationship", async () => {
      const payload = JSON.parse(JSON.stringify(comments.forCreation.requests.jsonapi));
      delete payload.data.relationships.parentComment;
      const result = await request.post("/comments").send(payload);
      expect(result.status).toEqual(201);
      expect(result.body).toEqual(comments.forCreation.responses.responseNoParentComment);
    });

    it("Create comment - invalid field - should fail", async () => {
      const payload = JSON.parse(JSON.stringify(comments.forCreation.requests.jsonapi));
      payload.data.attributes.wrongProp = "badProp";
      const result = await request.post("/comments").send(payload);
      expect(result.status).toEqual(500);
    });
  });

  describe("PATCH", () => {
    it("Update a comment - change body and parentComment", async () => {
      const result = await request.patch(`/comments/2`).send(comments.toUpdate.attributeAndRelationship.request);
      expect(result.body).toEqual(comments.toUpdate.attributeAndRelationship.response);
      expect(result.status).toEqual(200);
    });

    it("Update a comment - remove a non-required relationship", async () => {
      const result = await request.patch(`/comments/2`).send(comments.toUpdate.removeRelationship.request);
      expect(result.body).toEqual(comments.toUpdate.removeRelationship.response);
      expect(result.status).toEqual(200);
    });

    it("Update a comment - remove a required relationship - should fail", async () => {
      const result = await request.patch(`/comments/2`).send(comments.toUpdate.removeRelationship.requestForError);
      expect(result.status).toEqual(500);
    });
  });
});
