import Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("comments", table => {
    table.increments("_id").primary();
    table.string("body");
    table.string("type");
    table
      .integer("author_id")
      .notNullable()
      .references("id")
      .inTable("users");

    table
      .integer("parent_comment_id")
      .references("_id")
      .inTable("comments");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("comments");
}
