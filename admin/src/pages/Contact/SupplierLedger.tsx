import { useEffect, useState } from "react";
import api from "../../lib/axios";
import LazyTable from "../../components/tables/LazyTable";
import TableFilterBar from "../../components/filters/TableFilterBar";
import Pagination from "../../components/filters/Pagination";
import { Link, useParams } from "react-router";
import type { LedgerListItem, PaginatedResult } from "../../types/type";
import TimeAgo from "../../components/Ui/TimeAgo";
import Helper from "../../utils/helper";
import { languageStore, toBengaliNum } from "../../stores/language.store";




export default function SupplierLedger() {
  const [data, setData] = useState<PaginatedResult<LedgerListItem>>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);
  const loc = (n: string | number): string => (language === "bn" ? toBengaliNum(n) : String(n));

  const localizeType = (type: string): string =>
    language === "bn"
      ? type === "sale"
        ? "বিক্রয়"
        : type === "sale_return"
          ? "বিক্রয় ফেরত"
          : type === "purchase"
            ? "ক্রয়"
            : type === "purchase_return"
              ? "ক্রয় ফেরত"
              : type === "payment_in"
                ? "পেমেন্ট (আগমন)"
                : type === "payment_out"
                  ? "পেমেন্ট (বহির্গমন)"
                  : type
      : type;

  const fetchLedger = async () => {

    const res = await api("/ledger/list", {
      params: { contactID: id, limit, page },
    });
    if (res.data.success) setData(res.data.data);
  };

  useEffect(() => {
    fetchLedger();
  }, [limit, page]);


  // const handleDelete = async (id: string) => {

  //   toast("Are you sure?", {
  //     action: {
  //       label: "Delete",
  //       onClick: async () => {
  //         await api.delete(`/sale/delete/${id}`);
  //         await fetchProducts();
  //       },
  //     },
  //     cancel: {
  //       label: "Cancel",
  //       onClick: () => { },
  //     },
  //   });
  // };



  return (
    <div className=" space-y-4">
      <TableFilterBar
        title={t("Supplier Ledger", "সরবরাহকারী খতিয়ান")}
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
          printEnable={true}
        keyExtractor={(row) => row.id}
        columns={[
          {
            header: t("Type", "ধরন"), accessor: (row) => (

              <h1>{localizeType(row?.type)}</h1>

            ), className: "text-start", headerClassName: "text-start",
          },

          
          { header: t("Discount", "ডিসকাউন্ট"), accessor: (row) => loc(Number(row?.discount) || 0), className: "text-center" },
          {
            header: t("Prev. Due", "বাকি"), accessor: (row) => (
              <div className="flex gap-2 justify-center">
                <h1
                  className=""
                >
                  {row?.balanceBefore < 0 ? loc((Math.abs(row?.balanceBefore))) : 0}

                </h1>
              </div>
            ), className: "text-center"
          },

          { header: t("Total Payable", "পেমেন্ট পরিমাণ"), accessor: (row) => <div> {((row.type === "payment_in") || (row.type === "payment_out")) && row.balanceBefore < 0 ? loc((Math.abs(row?.balanceBefore))) : loc(Number(row?.amount))}</div>, className: "text-center" },

          { header: t("Payment Amount", "পেমেন্ট পরিমাণ"), accessor: (row) => loc(Number(row?.paidAmount) || 0), className: "text-center" },
          {
            header: t("Current Due", "বাকি"), accessor: (row) => (
              <div className="flex gap-2 justify-center">
                <h1
                  className=""
                >
                  {loc((Math.abs(row.dueAmount)))}
                </h1>
              </div>
            ), className: "text-center"
          },
          {
            header: t("Balance", "ব্যালেন্স"),
            className: "text-center",
            headerClassName: "text-center min-w-20",
            accessor: (row) => (

              <h1 className={`${row?.balanceAfter > 0 ? "text-red-500" : row?.balanceAfter < 0 ? "text-green-500" : "text-gray-500"}`}>
                {row?.balanceAfter > 0
                  ? `${t("Payable", "পরিশোধযোগ্য")} - ${loc(Helper.formatLongNumber(Math.abs(row?.balanceAfter)))}`
                  : row?.balanceAfter < 0
                    ? `${t("Receivable", "আদায়যোগ্য")} - ${loc(Helper.formatLongNumber(Math.abs(row?.balanceAfter)))}`
                    : t("Settled", "নিষ্পত্তি")}
              </h1>

            )
          },

          {
            header: t("Date", "তারিখ"),
            className: "text-center",
            headerClassName: "text-center min-w-20",
            accessor: (row) => (

              <div className="flex flex-col">   <TimeAgo date={row.date} /> <span className="text-xs">{Helper.formatDate(row.date)}</span></div>

            )

          },

          {
              printHide:true,
            header: t("Action", "অ্যাকশন"),
            headerClassName: "text-right",
            className: "text-right",
            accessor: (row) => (
              <div className="flex gap-2 justify-end">
                {row.type === "sale" ? (
                  <Link to={`/sale/invoice/${row?.saleID}`} className="global_button bg-[#238b95]">{t("Sale", "বিক্রয়")}</Link>
                ) : row.type === "sale_return" ? (
                  <Link to={`/sale/invoice/${row?.saleReturnID}`} className="global_button bg-[#e07b39]">{t("Sale Return", "বিক্রয় ফেরত")}</Link>
                ) : row.type === "purchase" ? (
                  <Link to={`/purchase/invoice/${row?.purchaseID}`} className="global_button bg-[#7b52ab]">{t("Purchase", "ক্রয়")}</Link>
                ) : row.type === "purchase_return" ? (
                  <Link to={`/purchase/${row?.purchaseReturnID}`} className="global_button bg-[#c0392b]">{t("Purchase Return", "ক্রয় ফেরত")}</Link>
                ) : row.type === "payment_in" || row.type === "payment_out" ? (
                  <Link to={`/account/payment-details/${row?.paymentID}`} className="global_button bg-[#38ad51]">{t("Payment Details", "পেমেন্ট বিবরণ")}</Link>
                ) : ""}

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