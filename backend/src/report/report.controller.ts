import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import ReportService from "./report.service";

export class ReportController {

  static async dashboardReport(req: Request, res: Response) {
    const dashboardReport = await ReportService.dashboardReport(req.query);
    res.status(200).json({ success: true, data: dashboardReport });
  }

  static async lowStockProducts(req: Request, res: Response) {

    const lowStockProducts = await ReportService.lowStockProducts(req.query);
    res.status(200).json({ success: true, data: lowStockProducts });
  }

  static async stockOutProducts(req: Request, res: Response) {
    const lowStockProducts = await ReportService.stockOutProducts(req.query);
    res.status(200).json({ success: true, data: lowStockProducts });
  }

  static async cashFlow(req: Request, res: Response) {
    const lowStockProducts = await ReportService.cashFlow(req.query);
    res.status(200).json({ success: true, data: lowStockProducts });
  }

  static async profitLoss(req: Request, res: Response) {
    const { startDate, endDate } = req.query;

    const query = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const result = await ReportService.profitLossReport(query);

    return res.status(200).json({
      success: true,
      message: "Profit & Loss report fetched successfully",
      data: result,
    });
  }

}