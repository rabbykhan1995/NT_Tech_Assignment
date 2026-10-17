import { useEffect, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import TableFilterBar from "../../components/filters/TableFilterBar";
import Pagination from "../../components/filters/Pagination";
import { Link} from "react-router";
import type { PaginatedResult, SaleListItem } from "../../types/type";
import TimeAgo from "../../components/Ui/TimeAgo";
import Helper from "../../utils/helper";
import { languageStore} from "../../stores/language.store";

export default function SaleList() {
    const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  const [data, setData] = useState<PaginatedResult<SaleListItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);


  const fetchProducts = async () => {
    const res = await api("/sale/list", {
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
        title={t("Sale List", "বিক্রয় তালিকা")}
        subtitle={`Total: ${data.total}`}
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        addHref="/product/new"
        addLabel="New Product"
        limit={limit}
        onLimitChange={(val) => { setLimit(val); setPage(1); }}
      />

      <LazyTable
        printEnable={true}
        printHeader={
          <div className="text-sm">
            <h2 className="font-bold text-base">{t("Sale List", "বিক্রয় তালিকা")}</h2>
            <p>Total: {data.total} | Page {data.page} of {Math.ceil(data.total / data.limit)}</p>
          </div>
        }
        data={data.items}
        keyExtractor={(row) => String(row.id)}
        columns={[
          {
            header: t("Invoice", "চালান"), accessor: (row) => (

              <Link to={`/sale/invoice/${row.id}`}
                className="text-sm"
              >
                {row.invoiceNo}
              </Link>

            ), className: "text-start", headerClassName: "text-start",
          },
          {
            header: t("Other Cost", "অন্যান্য খরচ"), accessor: (row) => (
              <span> {Helper.formatLongNumber(row.otherCost || 0)}</span>

            ), className: "text-center"
          },
          {
            header: t("Discount", "ছাড়"), accessor: (row) => (
              <span> {Helper.formatLongNumber(row.discount)}</span>

            ), className: "text-center"
          },

          {
            header: t("Paid", "পরিশোধিত"), accessor: (row) => (
              <span> {Helper.formatLongNumber(row.paid)}</span>

            ), className: "text-center"
          },

          {
            header: t("Date", "তারিখ"),
            className: "text-center",
            headerClassName: "text-center min-w-20",
            accessor: (row) => (

               <h1 className="flex flex-col">
                <TimeAgo date={new Date(row.saleDate)} />{" "}
                <span className="text-xs">{Helper.formatDate(new Date(row.saleDate))}</span>
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