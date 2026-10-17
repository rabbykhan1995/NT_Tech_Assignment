import z from "zod";
import { createPurchaseSchema, purchaseSchema, updatePurchaseSchema } from "./purchase.validator";
import { purchaseTable } from "./purchase.table";
import { purchaseItemsTable } from "./purchase_items.table";

// supplier k ami koto due rakhlam, naki ami supplier k advance dilam,amr perspective theke supplier, 
export type Purchase = typeof purchaseTable.$inferSelect;

export type OnlyPurchasePayload = typeof purchaseTable.$inferInsert;

export type PurchaseItem = typeof purchaseItemsTable.$inferSelect;

export type PurchaseItemPayload = typeof purchaseItemsTable.$inferInsert;

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
// z.infer<typeof purchaseSchema>;
