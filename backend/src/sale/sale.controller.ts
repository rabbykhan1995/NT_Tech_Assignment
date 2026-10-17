import { Request, Response } from "express";
import { CreateSaleInput} from "./sale.type";
import { ApiError } from "../../utils/ApiError";
import SaleService from "./sale.service";

export class SaleController {
  static async create(req: Request, res: Response) {
    const payload: CreateSaleInput = req.body;
    let sale = await SaleService.create(payload);
      res.status(201).json({ success: true, data: sale, msg: "Sale created successfully" });
  }
  static async list(req: Request, res: Response) {
    const result = await SaleService.list(req.query);

    res.status(200).json({ success: true, data: result });
  }
  static async saleByID(req: Request, res: Response) {
    const { id } = req.params;
    const saleID = Number(id);
    if (isNaN(saleID)) throw new ApiError(400, "Invalid sale ID");

    const sale = await SaleService.saleInvoiceByID(saleID);

    if (!sale) throw new ApiError(404, "Sale not found");

    return res.status(200).json({ success: true, data: sale });
  }

}