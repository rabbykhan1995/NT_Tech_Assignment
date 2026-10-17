import {
  pgTable,
  timestamp,
  serial,
  integer,
  numeric,
  varchar,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// আপনার প্রোজেক্টের পাথ অনুযায়ী ইমপোর্টগুলো চেক করে নেবেন
import { contactTable } from "../contact/contact.table";
import { ledgerTable } from "../ledger/ledger.table";
import { saleItemsTable } from "./sale_items.table";

// Invoice sequence: single-row table with a stable primary key so that
// `INSERT ... ON CONFLICT (id) DO UPDATE` can atomically hand out the next
// invoice number without race conditions.
export const saleInvoiceSeqTable = pgTable("sale_invoice_seq", {
  id: integer("id").primaryKey().default(1),
  lastNo: integer("last_no").notNull().default(100000),
});

// --- ১. মূল সেলস টেবিল ---
export const saleTable = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),

    saleDate: timestamp("sale_date", { withTimezone: true })
      .defaultNow()
      .notNull(),

    invoiceNo: integer("invoice_no").notNull(),

    // customerID (nullable হতে পারে ওয়াকিং কাস্টমারের জন্য, তাই .notNull() দেওয়া হয়নি)
    customerID: integer("customer_id").references(() => contactTable.id),

    note: text("note"),

    costName: varchar("cost_name", { length: 255 }),



    // ফাইনান্সিয়াল হিসাবের জন্য numeric টাইপ
    totalProductPrice: numeric("total_product_price", {
      precision: 12,
      scale: 2,
      mode: "number"
    }).default(0).notNull(),

    otherCost: numeric("other_cost", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).default(0).notNull(),

    discount: numeric("discount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).default(0).notNull(),

    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).default(0).notNull(),

    paid: numeric("paid", {
      precision: 12,
      scale: 2,
      mode: "number",
    }).default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  },
  (table) => [
    // Enforces a globally unique invoice number at the database level.
    uniqueIndex("sales_invoice_no_unique").on(table.invoiceNo),
  ]
);




export const saleRelations = relations(saleTable, ({ one, many }) => ({

  customer: one(contactTable, {
    fields: [saleTable.customerID],
    references: [contactTable.id],
  }),
  // ১টি সেলের আন্ডারে অনেক প্রোডাক্ট থাকতে পারে
  items: many(saleItemsTable),
  // ১টি সেলের আন্ডারে অনেক পেমেন্ট/এক্সচেঞ্জ ট্রানজেকশন থাকতে পারে (সেন্ট্রাল টেবিল থেকে
  ledgers: one(ledgerTable),
}));

// সেলস আইটেম টেবিলের রিলেশন


