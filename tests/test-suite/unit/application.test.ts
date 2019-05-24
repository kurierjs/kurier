import { KnexProcessor, Application } from "../../../src";


describe("Application", () => {
  it("can be instantiated", async () => {
    const app = new Application({
      namespace: "api",
      types: [],
      processors: [],
      defaultProcessor: KnexProcessor
    });

    expect(app).not.toBeNull();
  });
});
