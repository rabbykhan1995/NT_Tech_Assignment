import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import fs from "node:fs";
import path from "node:path";

const url = new URL(process.env.DATABASE_URL!);

// Optional custom CA bundle. If `certs/ca.pem` exists we pin it; otherwise we
// fall back to Node's default trust store (which verifies the server's chain).
// `rejectUnauthorized` is always true — TLS verification is never disabled.
const caFile = path.resolve(process.cwd(), "certs/ca.pem");
const ssl = {
  rejectUnauthorized: true,
  ...(fs.existsSync(caFile) ? { ca: fs.readFileSync(caFile, "utf8") } : {}),
};

export default defineConfig({
  schema: "./drizzle/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl,
  },
});
