import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { purchaseTable } from "./purchase.table";
import { productTable } from "../product/product.table";

// Purchase line items. Mirrors the sales line-item model and is the only
// record created for each purchased product (no batch / separate item table).
export const purchaseItemsTable = pgTable(
  "purchase_items",
  {
    id: serial("id").primaryKey(),

    purchaseID: integer("purchase_id")
      .notNull()
      .references(() => purchaseTable.id, { onDelete: "cascade" }),

    productID: integer("product_id")
      .notNull()
      .references(() => productTable.id),

    purchasedQty: numeric("purchased_qty", {
      precision: 12,
      scale: 3,
      mode: "number",
    })
      .default(0)
      .notNull(),

    purchasePrice: numeric("purchase_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),

    salePrice: numeric("sale_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),

    warranty: integer("warranty").default(0).notNull(),

    expireDate: timestamp("expire_date", { withTimezone: true }),
  },
  (table) => [
    index("purchase_items_purchase_id_idx").on(table.purchaseID),
    index("purchase_items_product_id_idx").on(table.productID),
  ]
);

export const purchaseItemsRelations = relations(
  purchaseItemsTable,
  ({ one }) => ({
    purchase: one(purchaseTable, {
      fields: [purchaseItemsTable.purchaseID],
      references: [purchaseTable.id],
    }),
    product: one(productTable, {
      fields: [purchaseItemsTable.productID],
      references: [productTable.id],
    }),
  })
);
