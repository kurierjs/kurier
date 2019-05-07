import Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("articles", table => {
    table.increments("id").primary();
    table.string("body");
    table
      .integer("author_id")
      .references("id")
      .inTable("users");
    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("articles");
}
