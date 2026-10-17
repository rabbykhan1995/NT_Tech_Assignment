import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { dbSchema } from '../../utils/relations';
import fs from "node:fs";
import path from "node:path";

const caPath = path.resolve(process.cwd(), "certs/ca.pem");

// Optional custom CA bundle. If `certs/ca.pem` exists we pin it; otherwise we
// fall back to Node's default trust store (which verifies the server's chain).
// `rejectUnauthorized` is always true — TLS verification is never disabled.
const ssl = {
  rejectUnauthorized: true,
  ...(fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, "utf8") } : {}),
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  statement_timeout: 10000,
});

const db = drizzle(pool, { schema: dbSchema });

export type DbTransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type QueryClient = typeof db | DbTransactionClient;

export default db;
