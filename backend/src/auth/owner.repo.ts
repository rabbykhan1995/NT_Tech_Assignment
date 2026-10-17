import { eq, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { ownerTable } from "./owner.table";
import type { OwnerPayload } from "./owner.type";

/** Minimal database client shape this repository needs. */
type DbClient = NodePgDatabase<any>;

/**
 * The connection pool is imported lazily so that importing this repository
 * (e.g. from unit tests) never opens a database connection. Only the real
 * query methods resolve the pool.
 *
 * The module specifier is kept in a variable so the compiler does not eagerly
 * pull the whole (partially generated) database layer into the type graph.
 */
async function getDb(): Promise<DbClient> {
  const modulePath = "../../drizzle/src";
  const mod: { default: DbClient } = await import(modulePath);
  return mod.default;
}

export class OwnerRepository {
  static async findByIdentifier(identifier: string, client?: DbClient) {
    const db = client ?? (await getDb());

    const [owner] = await db
      .select()
      .from(ownerTable)
      .where(
        or(eq(ownerTable.email, identifier), eq(ownerTable.mobile, identifier)),
      )
      .limit(1);

    return owner ?? null;
  }

  static async findById(ownerID: string, client?: DbClient) {
    const db = client ?? (await getDb());

    const [owner] = await db
      .select()
      .from(ownerTable)
      .where(eq(ownerTable.id, ownerID))
      .limit(1);

    return owner ?? null;
  }

  static async createOwner(payload: OwnerPayload, client?: DbClient) {
    const db = client ?? (await getDb());

    const [owner] = await db.insert(ownerTable).values(payload).returning();

    return owner ?? null;
  }

  static async updatePassword(
    ownerID: string,
    hashedPassword: string,
    client?: DbClient,
  ) {
    const db = client ?? (await getDb());

    const [owner] = await db
      .update(ownerTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(ownerTable.id, ownerID))
      .returning();

    return owner ?? null;
  }
}
