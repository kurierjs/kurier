import { KnexProcessor, Operation, KnexRecord } from "../../jsonapi-ts";
import User from "./resource";
import { HasId } from "../../../../../src/processors/operation-processor";

const timeout = (data, time) => new Promise(resolve => setTimeout(() => resolve(data), time));

export default class UserProcessor extends KnexProcessor<User> {
  resourceClass = User;

  async get(op: Operation): Promise<HasId[]> {
    const { params, ref } = op;
    const { id, type } = ref;
    const tableName = this.typeToTableName(type);
    const filters = params ? { id, ...(params.filter || {}) } : { id };
    const resource = Object.create(this.resourceFor(type));
    const fields = params ? { ...params.fields } : {};
    const attributes = this.getColumns(
      Object.keys(resource.__proto__.attributes),
      fields,
      type
    );

    let records: KnexRecord[] = await this.knex(tableName)
      .leftOuterJoin('posts', 'posts.user_id', 'users.id')
      .where(queryBuilder => this.filtersToKnex(queryBuilder, filters))
      .select(...attributes, "users.id", 'posts.id as post.id', 'posts.title as post.title')
      .modify(queryBuilder => this.optionsBuilder(queryBuilder, op));

    // This is to extract the post stuff (this isn't 100% since left outer joins give multiple results per record if more than one post)
    records = records.map(record => {
      let r = {...record, posts: null };
      delete r['post.title'];
      delete r['post.id'];

      if (record['post.id']) {
        r.posts = [{
          id: record['post.id'],
          title: record['post.title'],
        }];
      }

      return r
    });

    return records;
  }

  attributes = {
    async friends(user: User) {
      return await timeout([
        {name: 'Joel'},
        {name: 'Ryan'},
      ], 2000);
    },

    coolFactor(): number {
      return 3;
    }
  }

  relationships = {
    async posts(this: UserProcessor, user: any) {
      if (user.posts !== undefined) {
        console.log('Loading Already Done!');
        return user.posts;
      }

      console.log('Loading Async');

      return await this.knex('posts')
        .where({ user_id: user.id })
        .select();
    }
  }
}
