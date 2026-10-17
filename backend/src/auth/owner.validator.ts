import { z } from "zod";

/**
 * Login accepts a single identifier which may be either the configured
 * email address or mobile number. Normalisation (trim / lowercase email)
 * happens in the service layer.
 */
export const ownerLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});
