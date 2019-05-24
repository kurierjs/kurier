// Update with your config settings.
import { join } from "path";

export default {
  development: {
    client: "sqlite3",
    connection: {
      filename: join(__dirname, "dev.sqlite3")
    },
    useNullAsDefault: true,
    debug: true
  },
  test: {
    client: "sqlite3",
    connection: {
      filename: join(__dirname, "test.sqlite3")
    },
    extension: "ts",
    useNullAsDefault: true,
    migrations: {
      directory: join(__dirname, "migrations")
    }
  }
};
