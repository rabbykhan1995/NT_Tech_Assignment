CREATE TYPE "public"."contact_type" AS ENUM('customer', 'supplier', 'both');--> statement-breakpoint
CREATE TYPE "public"."ledger_type" AS ENUM('sale', 'purchase');--> statement-breakpoint
CREATE TABLE "sale_invoice_seq" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_no" integer DEFAULT 100000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_date" timestamp with time zone DEFAULT now() NOT NULL,
	"invoice_no" integer NOT NULL,
	"customer_id" integer,
	"note" text,
	"cost_name" varchar(255),
	"total_product_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"other_cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"paid" numeric(12, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"sold_qty" numeric(10, 2) DEFAULT 0 NOT NULL,
	"sale_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"warranty" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"mobile" varchar(20) NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"stock" numeric(12, 3) DEFAULT 0 NOT NULL,
	"total_sold" numeric(12, 3) DEFAULT 0 NOT NULL,
	"alert_qty" numeric(18, 3) DEFAULT 0 NOT NULL,
	"purchase_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"sale_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount_price" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_invoice_seq" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"last_no" integer DEFAULT 100000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_date" timestamp with time zone DEFAULT now() NOT NULL,
	"invoice_no" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"note" text,
	"cost_name" varchar(255),
	"total_product_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"other_cost" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"paid" numeric(12, 2) DEFAULT 0 NOT NULL,
	"exchange_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"balance_before" numeric(12, 2) DEFAULT 0 NOT NULL,
	"balance_after" numeric(12, 2) DEFAULT 0 NOT NULL,
	"deletable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"purchased_qty" numeric(12, 3) DEFAULT 0 NOT NULL,
	"purchase_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"sale_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"warranty" integer DEFAULT 0 NOT NULL,
	"expire_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth_owner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255),
	"mobile" varchar(20),
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledgers" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "ledger_type" NOT NULL,
	"sale_id" integer,
	"purchase_id" integer,
	"contact_id" integer NOT NULL,
	"amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"note" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"purchase_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"min_order_qty" numeric(12, 3) DEFAULT 1 NOT NULL,
	"supplier_sku" varchar(120),
	"is_preferred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sales_invoice_no_unique" ON "sales" USING btree ("invoice_no");--> statement-breakpoint
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "contacts_tenant_mobile" ON "contacts" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "contacts_name_idx" ON "contacts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_invoice_no_unique" ON "purchases" USING btree ("invoice_no");--> statement-breakpoint
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_owner_email_unique" ON "auth_owner" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_owner_mobile_unique" ON "auth_owner" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "ledgers_tenant_contact_created_idx" ON "ledgers" USING btree ("contact_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_products_supplier_product_unique" ON "supplier_products" USING btree ("supplier_id","product_id");--> statement-breakpoint
CREATE INDEX "supplier_products_supplier_idx" ON "supplier_products" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_products_product_idx" ON "supplier_products" USING btree ("product_id");