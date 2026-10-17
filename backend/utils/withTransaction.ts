import db from "../drizzle/src";
import type { DbTransactionClient } from "../drizzle/src";

export type { DbTransactionClient };

export const withTransaction = async <T>(
  callback: (tx: DbTransactionClient) => Promise<T>
): Promise<T> => {
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx as DbTransactionClient);
    });
  } catch (error) {
    console.error("❌ Database Transaction Failed & Rolled Back:", error);
    throw error;
  }
};
