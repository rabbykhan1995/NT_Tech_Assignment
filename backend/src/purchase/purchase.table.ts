import {
  pgTable,
  timestamp,
  serial,
  boolean,
  integer,
  numeric,
  varchar,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { contactTable } from "../contact/contact.table";
import { ledgerTable } from "../ledger/ledger.table";
import { purchaseItemsTable } from "./purchase_items.table";

// Invoice sequence: single-row table with a stable primary key so that
// `INSERT ... ON CONFLICT (id) DO UPDATE` can atomically hand out the next
// invoice number without race conditions.
export const purchaseInvoiceSeqTable = pgTable("purchase_invoice_seq", {
  id: integer("id").primaryKey().default(1),
  lastNo: integer("last_no").notNull().default(100000),
});

export const purchaseTable = pgTable(
  "purchases",
  {
    id: serial("id").primaryKey(),

    purchaseDate: timestamp("purchase_date", { withTimezone: true })
      .defaultNow()
      .notNull(),

    invoiceNo: integer("invoice_no").notNull(),

    // mongoose-এর supplierID এখানে contactID এবং contactTable-কে রেফার করবে
    supplierID: integer("supplier_id")
      .notNull()
      .references(() => contactTable.id),

    note: text("note"),

    costName: varchar("cost_name", { length: 255 }),

    // ডেসিমেল সংখ্যার জন্য numeric টাইপ ব্যবহার করা বেস্ট (Precision, Scale)
    totalProductPrice: numeric("total_product_price", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    otherCost: numeric("other_cost", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    paid: numeric("paid", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    // Snapshots
    exchangeAmount: numeric("exchange_amount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    balanceBefore: numeric("balance_before", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    balanceAfter: numeric("balance_after", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),

    deletable: boolean("deletable").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // Enforces a globally unique invoice number at the database level.
    uniqueIndex("purchases_invoice_no_unique").on(table.invoiceNo),
  ]
);

// পারচেজ টেবিলের রিলেশন
export const purchaseRelations = relations(purchaseTable, ({ one, many }) => ({
  supplier: one(contactTable, {
    fields: [purchaseTable.supplierID],
    references: [contactTable.id],
  }),

  items: many(purchaseItemsTable),

  ledgers: one(ledgerTable),
}));
