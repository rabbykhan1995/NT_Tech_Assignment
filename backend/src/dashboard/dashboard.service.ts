import DashboardRepository from "./dashboard.repo";

export default class DashboardService {
  /**
   * High-level business snapshot built entirely from database records.
   * Revenue and profit are reported separately.
   */
  static async getOverview() {
    const [
      totalProducts,
      totalSuppliers,
      totalPurchases,
      totalSales,
      totalPurchaseValue,
      totalSalesValue,
      inventory,
      lowStockProducts,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      DashboardRepository.countProducts(),
      DashboardRepository.countSuppliers(),
      DashboardRepository.countPurchases(),
      DashboardRepository.countSales(),
      DashboardRepository.totalPurchaseValue(),
      DashboardRepository.totalSalesValue(),
      DashboardRepository.inventorySummary(),
      DashboardRepository.lowStockProducts(10),
      DashboardRepository.recentSales(5),
      DashboardRepository.recentPurchases(5),
    ]);

    return {
      cards: {
        totalProducts,
        totalSuppliers,
        totalPurchases,
        totalSales,
        totalPurchaseValue,
        totalSalesValue,
        inventoryQty: inventory.totalQty,
        inventoryValue: inventory.totalValue,
      },
      lowStockProducts,
      recentSales,
      recentPurchases,
    };
  }

  static async profitLossReport(query: { startDate?: Date; endDate?: Date }) {
    return DashboardRepository.profitLossReport(query);
  }

  static async cashFlow() {
    return DashboardRepository.cashFlow();
  }
}
