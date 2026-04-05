import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production" });

export default defineConfig({
  schema: "./src/db/schema",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.ACCOUNT_ID!,
    databaseId: process.env.DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
