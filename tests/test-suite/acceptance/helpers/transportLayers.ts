import { koaApp, expressApp } from "../../test-app/http";
import * as supertest from "supertest";
import * as agent from "supertest-koa-agent";

export default function testTransportLayer(transportLayer?: string): supertest.SuperTest<supertest.Test> {
  if (transportLayer === "express") {
    return supertest(expressApp);
  }
  return agent(koaApp);
}
