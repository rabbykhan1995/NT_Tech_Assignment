import { Ledger, LedgerPayload, } from "./ledger.type";
import db, { QueryClient } from "../../drizzle/src";
import { ledgerTable } from "./ledger.table";
import { desc, eq } from "drizzle-orm";
import { paginateQuery } from "../../utils/queryBuilder";

export default class LedgerRepository {
    constructor() { }

    static async create(
        payload: LedgerPayload,
        client: QueryClient = db
    ): Promise<Ledger> {

        const [ledger] = await client.insert(ledgerTable).values(payload).returning();

        return ledger??null;
    }

    static async list(query: {
        page?: number;
        limit?: number;
        search?: string;
        contactID?:number;
    }) {
        return paginateQuery({
            query: db.query.ledgerTable,
            countTable: ledgerTable,
             where: [
                  ...(query.contactID ? [eq(ledgerTable.contactID, query.contactID)] : []),
                ],
            page: query.page,
            limit: query.limit,
            search: query.search,
            orderBy: [desc(ledgerTable.date), desc(ledgerTable.id)],
        });
    }
    static async findByID(
        id: number,
        client:QueryClient=db
    ) {

        const [ledger]  =  await client.select().from(ledgerTable).where(eq(ledgerTable.id,id)).limit(1);

        return ledger??null
    }
}