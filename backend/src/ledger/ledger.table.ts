import {
  pgTable,
  serial,
  integer,
  numeric,
  text,
  timestamp,
  index,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// আপনার প্রোজেক্টের পাথ অনুযায়ী ইমপোর্টগুলো চেক করে নেবেন

import { saleTable } from "../sale/sale.table";
import { purchaseTable } from "../purchase/purchase.table";
import { contactTable } from "../contact/contact.table";


// ১. লেজার এন্ট্রির টাইপ এনাম
export const ledgerTypeEnum = pgEnum("ledger_type", [
  "sale",
  "purchase",
]);

export const ledgerTable = pgTable(
  "ledgers",
  {
    id: serial("id").primaryKey(),
    type: ledgerTypeEnum("type").notNull(),
    // ২. এক্সপ্লিসিট অপশনাল ফরেন কি-সমূহ (মঙ্গুসের typeID ও refPath এর পরিবর্তে)
    saleID: integer("sale_id").references(() => saleTable.id, {
      onDelete: "cascade",
    }),

    purchaseID: integer("purchase_id").references(() => purchaseTable.id, {
      onDelete: "cascade",
    }),

    // ৩. কোন কাস্টমার বা সাপ্লায়ারের লেজার
    contactID: integer("contact_id")
      .notNull()
      .references(() => contactTable.id),
    // ৪. ফাইনান্সিয়াল ক্যালকুলেশনের জন্য numeric টাইপ
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2, mode: "number" }).default(0).notNull(),

    note: text("note"),
    date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ledgers_tenant_contact_created_idx").on(
      table.contactID,
      table.createdAt
    ),
  ]
);

export const ledgerRelations = relations(ledgerTable, ({ one }) => ({
  contact: one(contactTable, {
    fields: [ledgerTable.contactID],
    references: [contactTable.id],
  }),

  sale: one(saleTable, {
    fields: [ledgerTable.saleID],
    references: [saleTable.id],
  }),
  purchase: one(purchaseTable, {
    fields: [ledgerTable.purchaseID],
    references: [purchaseTable.id],
  }),
}));