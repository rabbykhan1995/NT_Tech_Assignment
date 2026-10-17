import { useEffect, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import TableFilterBar from "../../components/filters/TableFilterBar";
import Pagination from "../../components/filters/Pagination";
import { Edit} from "lucide-react";
import { Link } from "react-router";
import type { PaginatedResult, Product} from "../../types/type";
import Helper from "../../utils/helper";

import { languageStore, toBengaliNum } from "../../stores/language.store";




export default function ProductList() {
  const [data, setData] = useState<PaginatedResult<Product>>({
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
    const res = await api("/product/list", {
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
        title={t("Products", "পণ্য তালিকা")}
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
          { header: "#", accessor: (_, i) => loc((i ?? 0) + 1), className: "text-center", headerClassName: "text-center", },
          {
            header: t("Name", "নাম"), accessor: (row) =>

              <h1 className="max-w-[200px]">{row?.name}</h1>, headerClassName: "min-w-[200px]"
          },

          {
            header: t("S. Price", "বিক্রয় মূল্য"), accessor: (row) =>

              <h1 className="flex justify-center">{loc(Helper.formatLongNumber(row?.salePrice))}</h1>
            , className: "text-center"
          },
          {
            header: t("Action", "অ্যাকশন"),
            headerClassName: "text-right",
            className: "text-right",
            accessor: (row) => (
              <div className="flex gap-2 justify-end">
                {Helper.isPermitter('product:update') && <Link to={`/product/edit/${row.id}`}
                  className="global_button"
                >
                  <Edit size={18} />
                </Link>}
              </div>
            ),
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