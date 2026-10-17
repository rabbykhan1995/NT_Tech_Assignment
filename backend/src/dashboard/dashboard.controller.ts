import { Request, Response } from "express";
import DashboardService from "./dashboard.service";

export class DashboardController {
  static async overview(_req: Request, res: Response) {
    const data = await DashboardService.getOverview();
    res.status(200).json({ success: true, data });
  }

  static async profitLoss(req: Request, res: Response) {
    const { startDate, endDate } = req.query;

    const data = await DashboardService.profitLossReport({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({ success: true, data });
  }

  static async cashFlow(_req: Request, res: Response) {
    const data = await DashboardService.cashFlow();
    res.status(200).json({ success: true, data });
  }
}
