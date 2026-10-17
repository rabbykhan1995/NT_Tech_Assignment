import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Single business-owner account.
 *
 * This is intentionally self-contained: it does NOT depend on the
 * multi-tenant `staffs`/`roles`/`tenants` tables. The application is a
 * single-owner ERP, so exactly one predefined owner is stored here and
 * initialised from environment variables by the seed script.
 */
export const ownerTable = pgTable(
  "auth_owner",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),

    email: varchar("email", { length: 255 }),

    mobile: varchar("mobile", { length: 20 }),

    password: varchar("password", { length: 255 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_owner_email_unique").on(table.email),
    uniqueIndex("auth_owner_mobile_unique").on(table.mobile),
  ],
);
