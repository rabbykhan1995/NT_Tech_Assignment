import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join(".")} ${e.message.toLowerCase()}`)
        .join(", ");

      res.status(400).json({ success: false, message });
      return;
    }

    req.body = result.data;
    next();
  };