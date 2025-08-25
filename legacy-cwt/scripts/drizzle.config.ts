import { defineConfig } from "drizzle-kit";

// Prefer a full DATABASE_URL if provided (recommended on Render/Supabase)
function withSsl(url: string) {
  // Append sslmode=require if not already present
  if (/[?&]sslmode=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "sslmode=require";
}

let databaseUrl: string | undefined = process.env.DATABASE_URL
  ? withSsl(process.env.DATABASE_URL)
  : undefined;

if (!databaseUrl) {
  if (!process.env.SUPABASE_URL) {
    throw new Error("DATABASE_URL or SUPABASE_URL must be set for database operations");
  }
  // Build from SUPABASE_URL and explicit DB credentials (do NOT use service role key as DB password)
  const supabaseUrl = new URL(process.env.SUPABASE_URL);
  const host = `db.${supabaseUrl.hostname}`;
  const port = process.env.SUPABASE_DB_PORT || "5432"; // default to direct Postgres port
  const database = process.env.SUPABASE_DB_NAME || "postgres";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const password = process.env.SUPABASE_DB_PASSWORD || ""; // must be set in environment
  if (!password) {
    throw new Error(
      "SUPABASE_DB_PASSWORD is required when DATABASE_URL is not provided"
    );
  }
  databaseUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password
  )}@${host}:${port}/${encodeURIComponent(database)}?sslmode=require`;
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
