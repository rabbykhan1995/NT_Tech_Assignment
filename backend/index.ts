import "dotenv/config";
import app from "./app";
import db from "./drizzle/src";
import { sql } from "drizzle-orm";

const PORT = process.env.PORT || 5000;

try {
  await db.execute(sql`SELECT 1`);
  console.log("✅ Database connected");
} catch (error) {
  console.error("❌ Database connection failed", error);
}

// ---------------------------------------------------------
// TIMEOUT MANAGEMENT (Slowloris Attack & Stale Connection Protection)
// ---------------------------------------------------------
 app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
