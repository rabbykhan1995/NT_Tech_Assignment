import { OnlyPurchasePayload, Purchase, PurchaseItemPayload } from "./purchase.type";
import { paginateQuery } from "../../utils/queryBuilder";
import { purchaseInvoiceSeqTable, purchaseTable } from "./purchase.table";
import { purchaseItemsTable } from "./purchase_items.table";
import { and, desc, eq, sql } from "drizzle-orm";
import db, { QueryClient } from "../../drizzle/src";

export default class PurchaseRepository {

    /**
     * Atomically reserves and returns the next purchase invoice number.
     *
     * Uses a single-row sequence table with a stable primary key so that
     * concurrent transactions each get a distinct number (`INSERT ... ON
     * CONFLICT (id) DO UPDATE ... RETURNING` takes a row lock).
     */
    static async getNextInvoiceNo(client: QueryClient = db): Promise<number> {
        const [row] = await client
            .insert(purchaseInvoiceSeqTable)
            .values({ id: 1, lastNo: 100001 })
            .onConflictDoUpdate({
                target: purchaseInvoiceSeqTable.id,
                set: { lastNo: sql`${purchaseInvoiceSeqTable.lastNo} + 1` },
            })
            .returning({ lastNo: purchaseInvoiceSeqTable.lastNo });

        return row.lastNo;
    }

    static async purchaseCreate(
        payload: OnlyPurchasePayload,
        client: QueryClient = db
    ): Promise<Purchase> {

        const [purchase] = await client.insert(purchaseTable).values(payload).returning();

        return purchase;
    }

    static async createPurchaseItem(
        payload: PurchaseItemPayload,
        client: QueryClient = db
    ) {
        const [item] = await client
            .insert(purchaseItemsTable)
            .values(payload)
            .returning();

        return item;
    }

    static async getPurchaseItemsByPurchaseID(
        purchaseID: number,
        client: QueryClient = db
    ) {
        return client.query.purchaseItemsTable.findMany({
            where: eq(purchaseItemsTable.purchaseID, purchaseID),
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

    static async findByID(
        purchaseID: number,
        client: QueryClient = db
    ): Promise<Purchase> {
        const [purchase] = await client
            .select()
            .from(purchaseTable)
            .where(and(eq(purchaseTable.id, purchaseID), eq(purchaseTable.isDeleted, false)))
            .limit(1);

        return purchase
    }

    static async findByIDRaw(
        purchaseID: number,
        client: QueryClient = db
    ): Promise<Purchase> {
        const [purchase] = await client
            .select()
            .from(purchaseTable)
            .where(eq(purchaseTable.id, purchaseID))
            .limit(1);

        return purchase
    }

    static async list(query: {
        page?: number;
        limit?: number;
        search?: string;
    }) {

        return paginateQuery({
            query: db.query.purchaseTable,
            countTable: purchaseTable,
            searchColumns: [sql`${purchaseTable.invoiceNo}::text`],
            where: [
                eq(purchaseTable.isDeleted, false),
            ],
            page: query.page,
            limit: query.limit,
            search: query.search,
            orderBy: desc(purchaseTable.createdAt),
            with: {
                supplier: {
                    columns: {
                        name: true,
                    },
                },
            }
        });
    }

    static async purchaseInvoiceByID(
        purchaseID: number,
        client: QueryClient = db
    ) {
        const purchase = await client.query.purchaseTable.findFirst({
            where: and(eq(purchaseTable.id, purchaseID), eq(purchaseTable.isDeleted, false)),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return purchase;
    }


    static async purchaseForReturnByID(
        purchaseID: number,
        client: QueryClient = db
    ) {
        const purchase = await client.query.purchaseTable.findFirst({
            where: and(eq(purchaseTable.id, purchaseID), eq(purchaseTable.isDeleted, false)),
            with: {
                supplier: true,
                items: {
                    with: {
                        product: {
                            columns: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return purchase;
    }

    static async purchaseUpdateDynamic(
        purchaseID: number,
        data: Partial<typeof purchaseTable.$inferInsert>,
        client: QueryClient = db
    ) {
        const [updated] = await client
            .update(purchaseTable)
            .set(data)
            .where(eq(purchaseTable.id, purchaseID))
            .returning();

        return updated;
    }
}
