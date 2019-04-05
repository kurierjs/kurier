import { HasId, KnexProcessor, Operation } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor extends KnexProcessor<Article> {
  static async shouldHandle(op: Operation): Promise<boolean> {
    return op.ref.type === Article.type;
  }

  relationships = {
    async author(this: ArticleProcessor, article: HasId) {
      return await this.getQuery("users")
        .where({ id: article.authorId })
        .select();
    }
  };
}
