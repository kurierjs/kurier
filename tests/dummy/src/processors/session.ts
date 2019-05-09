import { SessionProcessor as JsonApiSessionProcessor } from "../jsonapi-ts";
import Session from "../resources/session";

export default class SessionProcessor<ResourceT extends Session> extends JsonApiSessionProcessor<ResourceT> {
  public static resourceClass = Session;
}
