import { MaybeMeta, Operation } from "../../../src";
import { KnexProcessor, HasId } from "../kurier";
import Article from "../resources/article";
import Vote from "../resources/vote";

export default class ArticleProcessor<ResourceT extends Article> extends KnexProcessor<ResourceT> {
  static resourceClass = Article;

  async meta(resourceOrResources: ResourceT | ResourceT[]): Promise<MaybeMeta> {
    return {
      meta: "ok",
    };
  }

  async metaFor(op: Operation, resourceOrResources: ResourceT | ResourceT[]): Promise<MaybeMeta> {
    return {
      metaFor: op.op,
    };
  }

  async metaForAdd(resourceOrResources: ResourceT | ResourceT[]): Promise<MaybeMeta> {
    return {
      metaForAdd: "ok",
    };
  }

  async metaForUpdate(resourceOrResources: ResourceT | ResourceT[]): Promise<MaybeMeta> {
    return {
      metaForUpdate: "ok",
    };
  }

  async metaForGet(resourceOrResources: ResourceT | ResourceT[]): Promise<MaybeMeta> {
    return {
      metaForGet: "ok",
    };
  }

  async resourceMeta(resource: ResourceT): Promise<MaybeMeta> {
    return {
      resourceMeta: "ok",
    };
  }

  async resourceMetaFor(op: Operation, resource: ResourceT): Promise<MaybeMeta> {
    return {
      resourceMetaFor: op.op,
    };
  }

  async resourceMetaForAdd(resource: ResourceT): Promise<MaybeMeta> {
    return {
      resourceMetaForAdd: "ok",
    };
  }

  async resourceMetaForUpdate(resource: ResourceT): Promise<MaybeMeta> {
    return {
      resourceMetaForUpdate: "ok",
    };
  }

  async resourceMetaForGet(resource: ResourceT): Promise<MaybeMeta> {
    return {
      resourceMetaForGet: "ok",
    };
  }

  attributes = {
    async voteCount(this: ArticleProcessor<Article>, article: HasId) {
      const processor = <KnexProcessor<Vote>>await this.processorFor("vote");

      const [result] = await processor
        .getQuery()
        .where({ [this.appInstance.app.serializer.relationshipToColumn("article")]: article.id })
        .count();

      return result["count(*)"];
    },
  };
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
