import { KnexProcessor, Application, ApplicationInstanceInterface } from "../../../src";

describe("Application", () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({
      namespace: "api",
      types: [],
      processors: [],
      defaultProcessor: KnexProcessor,
    });
  });

  it("can be instantiated", async () => {
    expect(app).not.toBeNull();
  });

  it("can attach hooks", async () => {
    const hook = async (appInstance: ApplicationInstanceInterface) => {
      expect(appInstance).toBeDefined();
    };

    app.hook("beforeAuthentication", hook);
    app.hook("beforeRequestHandling", hook);

    expect(app.hooks.beforeAuthentication).toHaveLength(1);
    expect(app.hooks.beforeRequestHandling).toHaveLength(1);
    expect(app.hooks.beforeAuthentication[0]).toEqual(hook);
    expect(app.hooks.beforeRequestHandling[0]).toEqual(hook);
  });
});
