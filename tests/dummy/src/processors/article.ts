import { KnexProcessor } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor extends KnexProcessor<Article> {
  static async shouldHandle(resourceType: string): Promise<boolean> {
    return resourceType === Article.type;
  }
}
