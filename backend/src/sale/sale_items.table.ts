import { index, integer, numeric, pgTable, serial } from "drizzle-orm/pg-core";
import { saleTable } from "./sale.table";
import { productTable } from "../product/product.table";
import { relations } from "drizzle-orm";

// --- ২. সেলস আইটেম/প্রোডাক্টস টেবিল (Mongoose products array-এর বিকল্প) ---
export const saleItemsTable = pgTable(
  "sale_items",
  {
    id: serial("id").primaryKey(),

    saleID: integer("sale_id")
      .notNull()
      .references(() => saleTable.id, { onDelete: "cascade" }),

    productID: integer("product_id")
      .notNull()
      .references(() => productTable.id),

    soldQty: numeric("sold_qty", { precision: 10, scale: 2, mode: "number" }).default(0).notNull(),
    salePrice: numeric("sale_price", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),

    warranty: integer("warranty").default(0).notNull(), // ওয়ারেন্টি মাস/দিন ট্র্যাকিংয়ের জন্য
  },
  (table) => [
    index("sale_items_sale_id_idx").on(table.saleID),
  ]
);

export const saleItemsRelations = relations(saleItemsTable, ({ one }) => ({
  sale: one(saleTable, {
    fields: [saleItemsTable.saleID],
    references: [saleTable.id],
  }),
  product: one(productTable, {
    fields: [saleItemsTable.productID],
    references: [productTable.id],
  }),
}));