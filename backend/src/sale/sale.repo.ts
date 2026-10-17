import db, { QueryClient } from "../../drizzle/src";
import { saleTable, saleInvoiceSeqTable } from "./sale.table";
import { paginateQuery } from "../../utils/queryBuilder";
import { OnlySalePayload, SaleItemPayload } from "./sale.type";
import { and, desc, eq, sql } from "drizzle-orm";
import { saleItemsTable } from "./sale_items.table";



export default class SaleRepository {

    /**
     * Atomically reserves and returns the next sale invoice number.
     *
     * Uses a single-row sequence table with a stable primary key so that
     * concurrent transactions each get a distinct number (`INSERT ... ON
     * CONFLICT (id) DO UPDATE ... RETURNING` takes a row lock).
     */
    static async getNextInvoiceNo(client: QueryClient = db): Promise<number> {
        const [row] = await client
            .insert(saleInvoiceSeqTable)
            .values({ id: 1, lastNo: 100001 })
            .onConflictDoUpdate({
                target: saleInvoiceSeqTable.id,
                set: { lastNo: sql`${saleInvoiceSeqTable.lastNo} + 1` },
            })
            .returning({ lastNo: saleInvoiceSeqTable.lastNo });

        return row.lastNo;
    }
    static async getSaleByID(
        saleID: number,
        client: QueryClient = db
    ) {
        const [sale] = await client
            .query.saleTable.findMany({
                where: and(
                    eq(saleTable.id, saleID),
                ),
                with: {
                    customer: true
                },
                limit: 1,
            });

        return sale;
    }

    static async getSaleByIDRaw(
        saleID: number,
        client: QueryClient = db
    ) {
        const [sale] = await client
            .select()
            .from(saleTable)
            .where(eq(saleTable.id, saleID))
            .limit(1);

        return sale;
    }


    static async create(payload: OnlySalePayload, client: QueryClient = db) {

        const result = await client.insert(saleTable).values(payload).returning();

        return result[0];
    }

    static async list(query: {
        page?: number;
        limit?: number;
        search?: string;
    }) {

        return paginateQuery({
            query: db.query.saleTable,
            countTable: saleTable,
            searchColumns: [sql`${saleTable.invoiceNo}::text`],
            page: query.page,
            limit: query.limit,
            search: query.search,
            orderBy: desc(saleTable.id),
            with: {
                customer: {
                    columns: {
                        name: true,
                    },
                },
            }
        });
    }


    static async getSoldProductsBySaleID(
        saleID: number,
        client: QueryClient = db
    ) {
        return await client.query.saleItemsTable.findMany({
            where: eq(saleItemsTable.saleID, saleID),
            with: {
                product: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    static async createSaleItem(payload: SaleItemPayload, client: QueryClient = db) {
        const result = await client.insert(saleItemsTable).values(payload).returning();

        return result[0];
    }

    static async update(
        saleID: number,
        data: Partial<typeof saleTable.$inferInsert>,
        client: QueryClient = db
    ) {
        const [updated] = await client
            .update(saleTable)
            .set(data)
            .where(eq(saleTable.id, saleID))
            .returning();

        return updated;
    }
}