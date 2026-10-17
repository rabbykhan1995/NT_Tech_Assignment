import z from "zod";

export const createLedgerSchema = z.object({
  type: z.enum([
    "sale",
    "purchase",
  ]),
  saleID: z.number().optional(),
  purchaseID: z.number().optional(),
  contactID: z.number( "Contact ID required"),
  amount: z.number().positive("Amount must be positive"),
  discount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  note: z.string().trim().optional(),
  date: z.coerce.date().optional(),
});

export const updateLedgerSchema = createLedgerSchema.partial();