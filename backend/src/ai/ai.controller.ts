import { Request, Response } from "express";
import AiService from "./ai.service";

export class AiController {
  static async analyze(req: Request, res: Response) {
    const result = await AiService.analyze(req.body);
    res.status(200).json({ success: true, data: result });
  }
}
