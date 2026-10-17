import { z } from "zod";

import { ownerTable } from "./owner.table";
import { ownerLoginSchema } from "./owner.validator";

export type Owner = typeof ownerTable.$inferSelect;

export type OwnerPayload = typeof ownerTable.$inferInsert;

export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;

/** Payload embedded in the owner JWT. Never contains the password hash. */
export type OwnerTokenPayload = {
  ownerID: string;
  tokenType: "owner";
};

/** Minimum owner information safe to return to the client. */
export type SafeOwner = Pick<Owner, "id" | "name" | "email" | "mobile">;
