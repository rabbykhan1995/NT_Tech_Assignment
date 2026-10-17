import {
  pgTable,
  serial,
  integer,
  numeric,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { contactTable } from "../contact/contact.table";
import { productTable } from "../product/product.table";

/**
 * Many-to-many relationship between suppliers (contacts) and products.
 *
 * Each row stores the commercial terms a given supplier offers for a given
 * product: supplier-specific purchase price, lead time, minimum order
 * quantity and an optional supplier SKU. This never overwrites the product's
 * general `purchasePrice`/`salePrice`.
 */
export const supplierProductTable = pgTable(
  "supplier_products",
  {
    id: serial("id").primaryKey(),

    supplierID: integer("supplier_id")
      .notNull()
      .references(() => contactTable.id, { onDelete: "cascade" }),

    productID: integer("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),

    // Supplier-specific purchase price (never the product's general price).
    purchasePrice: numeric("purchase_price", {
      precision: 12,
      scale: 2,
      mode: "number",
    })
      .default(0)
      .notNull(),

    // Expected delivery time in days.
    leadTimeDays: integer("lead_time_days").default(0).notNull(),

    // Minimum order quantity for this supplier-product pair.
    minOrderQty: numeric("min_order_qty", {
      precision: 12,
      scale: 3,
      mode: "number",
    })
      .default(1)
      .notNull(),

    // Optional supplier-specific SKU / product reference.
    supplierSKU: varchar("supplier_sku", { length: 120 }),

    // Whether this is the preferred supplier for the product.
    isPreferred: boolean("is_preferred").default(false).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("supplier_products_supplier_product_unique").on(
      table.supplierID,
      table.productID,
    ),
    index("supplier_products_supplier_idx").on(table.supplierID),
    index("supplier_products_product_idx").on(table.productID),
  ]
);

export const supplierProductRelations = relations(
  supplierProductTable,
  ({ one }) => ({
    supplier: one(contactTable, {
      fields: [supplierProductTable.supplierID],
      references: [contactTable.id],
    }),
    product: one(productTable, {
      fields: [supplierProductTable.productID],
      references: [productTable.id],
    }),
  })
);
