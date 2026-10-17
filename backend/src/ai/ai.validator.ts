import { z } from "zod";

export const aiAnalyzeSchema = z.object({
  question: z.string().trim().max(1000).optional(),
});

export type AiAnalyzeInput = z.infer<typeof aiAnalyzeSchema>;
