import { Request, Response } from "express";
import LedgerService from "./ledger.service";

export class LedgerController {
  static async list(req: Request, res: Response) {

    const result = await LedgerService.list(req.query);

    return res.status(200).json({ success: true, data: result });
  }
}