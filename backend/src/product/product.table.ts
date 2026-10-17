import {
  pgTable,
  varchar,
  timestamp,
  serial,
  numeric,
} from "drizzle-orm/pg-core";

export const productTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),

    stock: numeric("stock", { mode: "number", precision: 12, scale: 3 }).default(0).notNull(),

    totalSold: numeric("total_sold", { mode: "number", precision: 12, scale: 3 }).default(0).notNull(),

    alertQty: numeric("alert_qty", {
      precision: 18,
      scale: 3,
      mode: "number"
    })
      .default(0)
      .notNull(),


    purchasePrice: numeric("purchase_price", { mode: "number", precision: 12, scale: 2 }).default(0).notNull(),

    salePrice: numeric("sale_price", {
      precision: 12,
      scale: 2,
      mode: "number"
    }).default(0).notNull(),

    discountPrice: numeric("discount_price", {
      precision: 12,
      scale: 2,
      mode: "number"
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
  ]
);

