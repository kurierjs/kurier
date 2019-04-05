import { KnexRecord } from "../../../../src";
import { KnexProcessor, Operation } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor extends KnexProcessor<Article> {
  static async shouldHandle(op: Operation): Promise<boolean> {
    return op.ref.type === Article.type;
  }

  relationships = {
    async author(this: ArticleProcessor, article: KnexRecord) {
      return await this.knex("users")
        .where({ id: article.authorId })
        .select();
    }
  };
}
