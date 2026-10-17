import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { purchaseTable } from "../purchase/purchase.table";
import { saleTable } from "../sale/sale.table";
import { ledgerTable } from "../ledger/ledger.table";

// ১. টাইপের জন্য pgEnum ডিফাইন করা (Mongoose enum-এর বিকল্প)
export const contactTypeEnum = pgEnum("contact_type", ["customer", "supplier", "both"]);

export const contactTable = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),

    mobile: varchar("mobile", { length: 20 }).notNull(),

    address: text("address"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // ১. ইউনিক ইনডেক্স (শুধুমাত্র মোবাইলের ওপর - যাতে একই টেন্যান্টে একই কাস্টমার একাধিকবার এন্ট্রি না হয়)
    index("contacts_tenant_mobile").on(
      table.mobile
    ),

    // ২. সার্চ ও ফিল্টারিং ইনডেক্স (নাম দিয়ে কাস্টমার খুঁজাকে ফাস্ট করার জন্য - ইউনিক ছাড়া)
    index("contacts_name_idx").on(
      table.name
    ),
  ]
);

// ২. কন্টাক্ট টেবিলের সাথে পারচেজ বা অন্যান্য টেবিলের রিলেশন
export const contactRelations = relations(contactTable, ({ one, many }) => ({
  purchases: many(purchaseTable),
  sales: many(saleTable),
  ledgers: many(ledgerTable),
}))