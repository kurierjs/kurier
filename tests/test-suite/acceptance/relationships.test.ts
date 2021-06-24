import relationships from "./factories/relationships";

import testTransportLayer, {transportLayers} from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Relationships", () => {

    describe("GET", () => {
      it("Get 1st article votes (hasMany)(Multiple Results)", async () => {
        const result = await request.get(`/articles/1/votes`);
        expect(result.body).toEqual(relationships.get.votesOf1stArticle);
        expect(result.status).toEqual(200);
      });
    });

    describe("GET", () => {
      it("Get 2nd article vote (hasMany)(empty)", async () => {
        const result = await request.get(`/articles/2/votes`);
        expect(result.body).toEqual(relationships.get.votesOf2ndArticle);
        expect(result.status).toEqual(200);
      });
    });

    describe("GET", () => {
      it("Get 3rd article vote (hasMany)(Single Result)", async () => {
        const result = await request.get(`/articles/3/votes`);
        expect(result.body).toEqual(relationships.get.votesOf3rdArticle);
        expect(result.status).toEqual(200);
      });
    });

    describe("GET", () => {
      it("Get 1st vote article (BelongsTo)", async () => {
        const result = await request.get(`/votes/1/article`);
        expect(result.body).toEqual(relationships.get.articleOf1stVote);
        expect(result.status).toEqual(200);
      });
    });

    describe("GET", () => {
      it("Get ParentComment of 1st Comment (Recursive BelongsTo)", async () => {
        const result = await request.get(`/comments/1/parentComment`);
        expect(result.body).toEqual(relationships.get.parentCommentOf1stComment);
        expect(result.status).toEqual(200);
      });
    });

  });
});
