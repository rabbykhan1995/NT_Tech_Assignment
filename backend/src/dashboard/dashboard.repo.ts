import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";
import db, { QueryClient } from "../../drizzle/src";
import { productTable } from "../product/product.table";
import { saleTable } from "../sale/sale.table";
import { saleItemsTable } from "../sale/sale_items.table";
import { purchaseTable } from "../purchase/purchase.table";
import { contactTable } from "../contact/contact.table";
import { supplierProductTable } from "../supplier_product/supplier_product.table";

/**
 * Dashboard aggregations computed directly from the transactional tables.
 *
 * All money/quantity totals are calculated with SQL aggregates. Revenue and
 * COGS are deliberately kept in separate queries so that joining the
 * one-to-many `sale_items` relation cannot multiply (double-count) revenue.
 */
export default class DashboardRepository {
  static async countProducts(client: QueryClient = db): Promise<number> {
    const [row] = await client
      .select({ total: count() })
      .from(productTable);
    return Number(row?.total ?? 0);
  }

  /**
   * Suppliers are contacts that actually supply: either they appear on a
   * purchase or are linked to a product through supplier_products. (The
   * `contacts` table has no explicit supplier flag.)
   */
  static async countSuppliers(client: QueryClient = db): Promise<number> {
    const fromPurchases = client
      .select({ id: purchaseTable.supplierID })
      .from(purchaseTable)
      .where(eq(purchaseTable.isDeleted, false));

    const fromLinks = client
      .select({ id: supplierProductTable.supplierID })
      .from(supplierProductTable);

    const distinctSuppliers = union(fromPurchases, fromLinks).as("distinct_suppliers");

    const [row] = await client
      .select({ total: count() })
      .from(distinctSuppliers);

    return Number(row?.total ?? 0);
  }

  static async countPurchases(client: QueryClient = db): Promise<number> {
    const [row] = await client
      .select({ total: count() })
      .from(purchaseTable)
      .where(eq(purchaseTable.isDeleted, false));
    return Number(row?.total ?? 0);
  }

  static async countSales(client: QueryClient = db): Promise<number> {
    const [row] = await client
      .select({ total: count() })
      .from(saleTable);
    return Number(row?.total ?? 0);
  }

  static async totalPurchaseValue(client: QueryClient = db): Promise<number> {
    const [row] = await client
      .select({
        total: sql<number>`COALESCE(SUM(${purchaseTable.totalAmount}), 0)`,
      })
      .from(purchaseTable)
      .where(eq(purchaseTable.isDeleted, false));
    return Number(row?.total ?? 0);
  }

  static async totalSalesValue(client: QueryClient = db): Promise<number> {
    const [row] = await client
      .select({
        total: sql<number>`COALESCE(SUM(${saleTable.totalAmount}), 0)`,
      })
      .from(saleTable);
    return Number(row?.total ?? 0);
  }

  static async inventorySummary(client: QueryClient = db) {
    const [row] = await client
      .select({
        totalQty: sql<number>`COALESCE(SUM(${productTable.stock}), 0)`,
        totalValue: sql<number>`COALESCE(SUM(${productTable.stock} * ${productTable.purchasePrice}), 0)`,
      })
      .from(productTable);

    return {
      totalQty: Number(row?.totalQty ?? 0),
      totalValue: Number(row?.totalValue ?? 0),
    };
  }

  static async lowStockProducts(limit = 10, client: QueryClient = db) {
    return client
      .select({
        id: productTable.id,
        name: productTable.name,
        stock: productTable.stock,
        alertQty: productTable.alertQty,
        purchasePrice: productTable.purchasePrice,
        salePrice: productTable.salePrice,
      })
      .from(productTable)
      .where(sql`${productTable.stock} <= ${productTable.alertQty}`)
      .orderBy(productTable.stock)
      .limit(limit);
  }

  static async recentSales(limit = 5, client: QueryClient = db) {
    return client.query.saleTable.findMany({
      orderBy: desc(saleTable.id),
      limit,
      with: {
        customer: {
          columns: { id: true, name: true },
        },
      },
    });
  }

  static async recentPurchases(limit = 5, client: QueryClient = db) {
    return client.query.purchaseTable.findMany({
      where: eq(purchaseTable.isDeleted, false),
      orderBy: desc(purchaseTable.id),
      limit,
      with: {
        supplier: {
          columns: { id: true, name: true },
        },
      },
    });
  }

  static async countContacts(client: QueryClient = db): Promise<number> {
    const [row] = await client.select({ total: count() }).from(contactTable);
    return Number(row?.total ?? 0);
  }

  /**
   * Profit & Loss over a date range.
   *
   * revenue = SUM(sales.total_amount)   (sales table only — no join)
   * cogs    = SUM(sale_items.sold_qty * products.purchase_price)
   *
   * COGS uses the product's current purchase price as the cost basis. There
   * is no batch/COGS ledger available, so the result is an estimate, not an
   * authoritative margin. It is intentionally labelled as such by callers.
   */
  static async profitLossReport(query: { startDate?: Date; endDate?: Date }, client: QueryClient = db) {
    const start = query.startDate
      ? new Date(query.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const end = query.endDate ? new Date(query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const dateFilter = and(
      gte(saleTable.createdAt, start),
      lte(saleTable.createdAt, end),
    );

    const [revenueRow] = await client
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${saleTable.totalAmount}), 0)`,
      })
      .from(saleTable)
      .where(dateFilter);

    const [cogsRow] = await client
      .select({
        totalCogs: sql<number>`COALESCE(SUM(${saleItemsTable.soldQty} * ${productTable.purchasePrice}), 0)`,
      })
      .from(saleItemsTable)
      .innerJoin(saleTable, eq(saleItemsTable.saleID, saleTable.id))
      .innerJoin(productTable, eq(saleItemsTable.productID, productTable.id))
      .where(dateFilter);

    const revenue = Number(revenueRow?.totalRevenue ?? 0);
    const cogs = Number(cogsRow?.totalCogs ?? 0);

    const grossProfit = revenue - cogs;
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      period: { start, end },
      summary: {
        totalRevenue: revenue,
        cogs,
        grossProfit,
        profitMarginPercent: Number(profitMargin.toFixed(2)),
        // No operating-expense ledger is available in this snapshot, so net
        // profit equals gross profit. Do not present gross as net silently.
        note: "COGS is estimated from the product's current purchase price; operating expenses are not tracked.",
      },
    };
  }

  static async cashFlow(client: QueryClient = db) {
    const [saleRow] = await client
      .select({
        received: sql<number>`COALESCE(SUM(${saleTable.paid}), 0)`,
        due: sql<number>`COALESCE(SUM(${saleTable.totalAmount} - ${saleTable.paid}), 0)`,
      })
      .from(saleTable);

    const [purchaseRow] = await client
      .select({
        paid: sql<number>`COALESCE(SUM(${purchaseTable.paid}), 0)`,
        due: sql<number>`COALESCE(SUM(${purchaseTable.totalAmount} - ${purchaseTable.paid}), 0)`,
      })
      .from(purchaseTable)
      .where(eq(purchaseTable.isDeleted, false));

    return {
      cashIn: Number(saleRow?.received ?? 0),
      cashOut: Number(purchaseRow?.paid ?? 0),
      netCash: Number(saleRow?.received ?? 0) - Number(purchaseRow?.paid ?? 0),
      saleDue: Number(saleRow?.due ?? 0),
      purchaseDue: Number(purchaseRow?.due ?? 0),
    };
  }

  static async supplierProductPrices(client: QueryClient = db) {
    return client.query.supplierProductTable.findMany({
      with: {
        supplier: { columns: { id: true, name: true } },
        product: { columns: { id: true, name: true } },
      },
      orderBy: desc(supplierProductTable.updatedAt),
    });
  }

  static async salesHistoryByProduct(limit = 20, client: QueryClient = db) {
    // Aggregated sales per product; used by the AI analysis layer.
    return client
      .select({
        productID: productTable.id,
        productName: productTable.name,
        stock: productTable.stock,
        alertQty: productTable.alertQty,
        purchasePrice: productTable.purchasePrice,
        salePrice: productTable.salePrice,
        totalSold: sql<number>`COALESCE(${productTable.totalSold}, 0)`,
        soldQty: sql<number>`COALESCE(SUM(${saleItemsTable.soldQty}), 0)`,
        revenue: sql<number>`COALESCE(SUM(${saleItemsTable.soldQty} * ${saleItemsTable.salePrice}), 0)`,
      })
      .from(productTable)
      .leftJoin(saleItemsTable, eq(saleItemsTable.productID, productTable.id))
      .groupBy(
        productTable.id,
        productTable.name,
        productTable.stock,
        productTable.alertQty,
        productTable.purchasePrice,
        productTable.salePrice,
        productTable.totalSold,
      )
      .orderBy(desc(sql`COALESCE(SUM(${saleItemsTable.soldQty}), 0)`))
      .limit(limit);
  }
}
