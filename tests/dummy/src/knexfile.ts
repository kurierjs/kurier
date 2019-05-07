// Update with your config settings.
import { join } from "path";

export default {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./tests/dummy/db/dev.sqlite3"
    },
    useNullAsDefault: true,
    debug: true
  },
  test: {
    client: "sqlite3",
    connection: {
      filename: "./tests/dummy/db/test.sqlite3"
    },
    useNullAsDefault: true,
    migrations: {
      directory: join(__dirname, "migrations")
    }
  }
};
