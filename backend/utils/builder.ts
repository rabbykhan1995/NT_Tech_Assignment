import { CreateLedgerInput } from "../src/ledger/ledger.type";

export default class PayloadBuilder {
    constructor() { }
    static ledger(config: CreateLedgerInput) {

        return {
            type: config.type,

            contactID: config.contactID,

            amount: config.amount,

            paidAmount: config.paidAmount ?? 0,

            discount: config.discount ?? 0,

            note: config.note,

            date: config.date ?? new Date(),
        };
    }
}