import DashboardService from "../dashboard/dashboard.service";
import ProductService from "../product/product.service";

export default class ReportService {

    static async dashboardReport(_query: any) {
        return await DashboardService.getOverview();
    }

    static async lowStockProducts(query: any) {
        return await ProductService.lowStockProductList(query);

    }

    static async stockOutProducts(query: any) {
        return await ProductService.stockOutProductList(query);

    }

    static async cashFlow(_query: any) {
        return await DashboardService.cashFlow();

    }

    static async profitLossReport(query: { startDate?: Date; endDate?: Date }) {
        return await DashboardService.profitLossReport(query);
    }
}
