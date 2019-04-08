import { HasId, KnexProcessor } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor<RT = Article> extends KnexProcessor<RT> {
  static resourceClass = Article;

  relationships = {
    async author(this: ArticleProcessor<Article>, article: HasId) {
      const processor = await this.processorFor("user");

      return await (processor as KnexProcessor)
        .getQuery()
        .where({ id: article.authorId })
        .select();
    }
  };
}
