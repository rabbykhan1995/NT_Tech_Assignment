
import z from "zod";
import { createSaleSchema, updateSaleSchema, saleSchema } from "./sale.validator";
import { saleTable } from "./sale.table";
import { saleItemsTable } from "./sale_items.table";

// supplier k ami koto due rakhlam, naki ami supplier k advance dilam,amr perspective theke supplier, 
export type Sale = typeof saleTable.$inferSelect;

export type SaleItem = typeof saleItemsTable.$inferSelect;

// export type SaleItemPayload = typeof saleItemsTable.$inferInsert;

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export type OnlySalePayload = typeof saleTable.$inferInsert;

export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;

export type SaleItemPayload = typeof saleItemsTable.$inferInsert;

// z.infer<typeof saleSchema> & {
//   staffID?: string;
//   locationID?: number;
// };