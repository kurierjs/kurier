import { koaApp, expressApp, vercelApp } from "../../test-app/http";
import kurierApp from "../../test-app/app";

import * as supertest from "supertest";
import * as supertestKoa from "supertest-koa-agent";
import * as superagentDefaults from "superagent-defaults";
import supertestPrefix from "supertest-prefix";

const transportLayerContext = {
  vercel: {
    app: vercelApp,
    agent: supertest,
  },
  express: {
    app: expressApp,
    agent: supertest,
  },
  koa: {
    app: koaApp,
    agent: supertestKoa,
  },
};

export const transportLayers = Object.keys(transportLayerContext).map(layer => [layer]);

export default function testTransportLayer(transportLayer?: string) {
  const { app, agent }= transportLayerContext[transportLayer];
  const request = superagentDefaults(agent(app));

  request.use(supertestPrefix(`/${kurierApp.namespace}`));

  return request;
}
