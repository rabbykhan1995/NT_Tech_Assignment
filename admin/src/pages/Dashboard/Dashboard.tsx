import { useEffect, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import Helper from "../../utils/helper";
import { languageStore, toBengaliNum } from "../../stores/language.store";
import {
  Boxes,
  Truck,
  ShoppingCart,
  Package,
  Warehouse,
  Coins,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  alertQty: number;
  purchasePrice: number;
  salePrice: number;
}

interface RecentSale {
  id: number;
  invoiceNo: number;
  totalAmount: number;
  paid: number;
  saleDate: string;
  customer?: { id: number; name: string } | null;
}

interface RecentPurchase {
  id: number;
  invoiceNo: number;
  totalAmount: number;
  paid: number;
  purchaseDate: string;
  supplier?: { id: number; name: string } | null;
}

interface DashboardData {
  cards: {
    totalProducts: number;
    totalSuppliers: number;
    totalPurchases: number;
    totalSales: number;
    totalPurchaseValue: number;
    totalSalesValue: number;
    inventoryQty: number;
    inventoryValue: number;
  };
  lowStockProducts: LowStockProduct[];
  recentSales: RecentSale[];
  recentPurchases: RecentPurchase[];
}

const Dashboard = () => {
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const loc = (n: string | number): string =>
    language === "bn" ? toBengaliNum(n) : String(n);
  const money = (n: number): string => "৳" + loc(Helper.formatLongNumber(Number(n) || 0));

  const [report, setReport] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api("report/dashboard");
      if (res.data.success) setReport(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
  }, []);

  const c = report?.cards;
  const lowStock = report?.lowStockProducts ?? [];

  const cards = c
    ? [
        { label: t("Products", "পণ্য"), value: loc(c.totalProducts), icon: <Boxes size={16} /> },
        { label: t("Suppliers", "সরবরাহকারী"), value: loc(c.totalSuppliers), icon: <Truck size={16} /> },
        { label: t("Sales", "বিক্রয়"), value: loc(c.totalSales), icon: <ShoppingCart size={16} /> },
        { label: t("Purchases", "ক্রয়"), value: loc(c.totalPurchases), icon: <Package size={16} /> },
        { label: t("Sales Value", "বিক্রয়মূল্য"), value: money(c.totalSalesValue), icon: <Coins size={16} /> },
        { label: t("Purchase Value", "ক্রয়মূল্য"), value: money(c.totalPurchaseValue), icon: <Coins size={16} /> },
        { label: t("Inventory Qty", "স্টক পরিমাণ"), value: loc(c.inventoryQty), icon: <Warehouse size={16} /> },
        { label: t("Inventory Value", "স্টক মূল্য"), value: money(c.inventoryValue), icon: <Warehouse size={16} /> },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="global_heading">{t("Dashboard", "ড্যাশবোর্ড")}</h1>
        <button
          onClick={() => void fetchReport()}
          className="global_button flex items-center gap-1.5 text-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {t("Refresh", "রিফ্রেশ")}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
              {card.icon}
              {card.label}
            </div>
            <div className="text-xl font-medium text-gray-900 dark:text-white">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Low stock products */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-medium">{t("Low stock products", "স্বল্প স্টক পণ্য")}</h2>
        </div>
        <LazyTable
          data={lowStock}
          keyExtractor={(row) => row.id}
          columns={[
            { header: t("Name", "নাম"), accessor: "name" },
            {
              header: t("Stock", "স্টক"),
              accessor: (row) => loc(row.stock),
              className: "text-center",
              headerClassName: "text-center",
            },
            {
              header: t("Alert Qty", "সতর্কতা স্টক"),
              accessor: (row) => loc(row.alertQty),
              className: "text-center",
              headerClassName: "text-center",
            },
            {
              header: t("Sale Price", "বিক্রয় মূল্য"),
              accessor: (row) => money(row.salePrice),
              className: "text-end",
              headerClassName: "text-right",
            },
          ]}
          footer={() => (
            <tr>
              <td colSpan={4} className="text-center text-xs text-gray-400">
                {lowStock.length === 0 ? t("No low stock products", "কোনো স্বল্প স্টক পণ্য নেই") : ""}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-sm font-medium mb-2">{t("Recent sales", "সাম্প্রতিক বিক্রয়")}</h2>
          <LazyTable
            data={report?.recentSales ?? []}
            keyExtractor={(row) => row.id}
            columns={[
              {
                header: t("Invoice", "ইনভয়েস"),
                accessor: (row) => loc(row.invoiceNo),
              },
              {
                header: t("Customer", "গ্রাহক"),
                accessor: (row) => row.customer?.name || t("Walking", "সাধারণ"),
              },
              {
                header: t("Total", "মোট"),
                accessor: (row) => money(row.totalAmount),
                className: "text-end",
                headerClassName: "text-right",
              },
              {
                header: t("Date", "তারিখ"),
                accessor: (row) => Helper.formatDate(new Date(row.saleDate)),
                className: "text-end",
                headerClassName: "text-right",
              },
            ]}
          />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-2">{t("Recent purchases", "সাম্প্রতিক ক্রয়")}</h2>
          <LazyTable
            data={report?.recentPurchases ?? []}
            keyExtractor={(row) => row.id}
            columns={[
              {
                header: t("Invoice", "ইনভয়েস"),
                accessor: (row) => loc(row.invoiceNo),
              },
              {
                header: t("Supplier", "সরবরাহকারী"),
                accessor: (row) => row.supplier?.name || "—",
              },
              {
                header: t("Total", "মোট"),
                accessor: (row) => money(row.totalAmount),
                className: "text-end",
                headerClassName: "text-right",
              },
              {
                header: t("Date", "তারিখ"),
                accessor: (row) => Helper.formatDate(new Date(row.purchaseDate)),
                className: "text-end",
                headerClassName: "text-right",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
