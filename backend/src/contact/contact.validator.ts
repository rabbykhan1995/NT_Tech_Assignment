import { z } from "zod";



export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile is required"),

  address: z.string().optional(),
});

export const updateContactSchema = createContactSchema
  .partial()