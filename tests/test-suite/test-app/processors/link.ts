import { KnexProcessor } from "../kurier";
import Link from "../resources/link";

export default class LinkProcessor<ResourceT extends Link> extends KnexProcessor<ResourceT> {
  static resourceClass = Link;


}
