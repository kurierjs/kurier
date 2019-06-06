import { koaApp, expressApp } from "../../test-app/http";
import * as supertest from "supertest";
import * as agent from "supertest-koa-agent";

export default function testTransportLayer(transportLayer?: string) {
  if (transportLayer === "express") {
    return supertest(expressApp);
  }
  return agent(koaApp);
}
