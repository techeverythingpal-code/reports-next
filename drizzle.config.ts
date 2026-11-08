import { defineConfig } from "drizzle-kit";

// The tables already exist (created by the Laravel migrations).
// Use `npm run db:pull` to compare against the live database, and only use
// `db:generate` / `db:migrate` for NEW changes once Laravel is retired.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
