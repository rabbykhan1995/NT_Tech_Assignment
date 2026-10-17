import { useEffect, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import TableFilterBar from "../../components/filters/TableFilterBar";
import Pagination from "../../components/filters/Pagination";
import { Link } from "react-router";
import type { PaginatedResult, PurchaseListItem } from "../../types/type";
import TimeAgo from "../../components/Ui/TimeAgo";
import Helper from "../../utils/helper";
import { languageStore, toBengaliNum } from "../../stores/language.store";




export default function PurchaseList() {
  const [data, setData] = useState<PaginatedResult<PurchaseListItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const loc = (n: string | number): string => (language === "bn" ? toBengaliNum(n) : String(n));

  const fetchProducts = async () => {
    const res = await api("/purchase/list", {
      params: { search, limit, page },
    });
    if (res.data.success) setData(res.data.data);
  };

  useEffect(() => {
    fetchProducts();
  }, [limit, page]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchProducts() }, 400)
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className=" space-y-4">
      <TableFilterBar
        title={t("Products", "পণ্যসমূহ")}
        subtitle={`${t("Total", "মোট")}: ${loc(data.total)}`}
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        addHref="/product/new"
        addLabel={t("New Product", "নতুন পণ্য")}
        limit={limit}
        onLimitChange={(val) => { setLimit(val); setPage(1); }}
      />

      <LazyTable
        data={data.items}
        keyExtractor={(row) => row.id}
        columns={[
          {
            header: t("Invoice", "চালান"), accessor: (row) => (

              <Link to={`/purchase/invoice/${row.id}`}
                className="text-sm"
              >
                {row.invoiceNo}
              </Link>

            ), className: "text-start", headerClassName: "text-start",
          },
          {
            header: t("Supplier", "সরবরাহকারী"), accessor: (row) => (

              <h1 className="min-w-[140px]" >{row?.supplier?.name}</h1>

            ), headerClassName: "text-start"
          },
  
          {
            header: t("Discount", "ডিসকাউন্ট"), accessor: (row) =>

              <h1 className="flex justify-center">{loc(Helper.formatLongNumber(row?.discount))}</h1>, className: "text-center"
          },
          {
            header: t("Paid", "পরিশোধিত"), accessor: (row) =>

              <h1 className="flex justify-center">{loc(Helper.formatLongNumber(row?.paid))}</h1>, className: "text-center"
          },

          {
            header: t("Date", "তারিখ"),
            className: "text-center",
            headerClassName: "text-center min-w-20",
            accessor: (row) => (
              <h1 className="flex flex-col">
                <TimeAgo date={new Date(row.purchaseDate)} />{" "}
                <span className="text-xs">{Helper.formatDate(new Date(row.purchaseDate))}</span>
              </h1>
            )
          },
        ]}
      />

      {/* Pagination */}
      <Pagination
        total={data.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
      />
    </div>
  );
}