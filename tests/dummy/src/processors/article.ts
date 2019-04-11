import { KnexProcessor } from "../jsonapi-ts";
import Article from "../resources/article";

export default class ArticleProcessor<ResourceT extends Article> extends KnexProcessor<ResourceT> {
  static resourceClass = Article;

  // relationships = {
  //   async author(this: ArticleProcessor<Article>, article: HasId) {
  //     const processor = await this.processorFor("user");

  //     const result = await (processor as KnexProcessor)
  //       .getQuery()
  //       .where({ id: article.authorId })
  //       .select();

  //     return result;
  //   }
  // };
}
