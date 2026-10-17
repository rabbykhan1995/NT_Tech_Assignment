import z from "zod";
import { createLedgerSchema, updateLedgerSchema } from "./ledger.validator";
import { ledgerTable } from "./ledger.table";

export type Ledger = typeof ledgerTable.$inferSelect;

export type LedgerPayload = typeof ledgerTable.$inferInsert;



export type CreateLedgerInput = {
  type:
  | "sale"
  | "purchase"

  saleID?: number;

  purchaseID?: number;

  contactID: number;

  amount: number;

  discount?: number;

  paidAmount?: number;

  note?: string;

  date?: Date;
};
export type UpdateLedgerInput = z.infer<typeof updateLedgerSchema>;


export type AllLedgerResponse = Ledger[];