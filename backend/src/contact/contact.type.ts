import z from "zod";
import { createContactSchema, updateContactSchema } from "./contact.validator";
import { contactTable, contactTypeEnum } from "./contact.table";

export type ContactType = (typeof contactTypeEnum.enumValues)[number];
export type Contact = typeof contactTable.$inferSelect;
export type CreateContactInput = z.infer<typeof createContactSchema> & { userID?: string };
export type UpdateContactInput = z.infer<typeof updateContactSchema> & { userID?: string };