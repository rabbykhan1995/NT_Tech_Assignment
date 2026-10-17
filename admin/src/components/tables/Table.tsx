import React, { useRef } from "react";
import { Printer } from "lucide-react";
import { languageStore } from "../../stores/language.store";

type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T, index?: number) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  printHide?: boolean;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  footer?: (columnCount: number) => React.ReactNode;
  rowClassName?: (row: T) => string;
  printEnable?: boolean;
  printHeader?: React.ReactNode;
};

export default function Table<T>({ columns, data, keyExtractor, footer, rowClassName, printEnable = false, printHeader }: TableProps<T>) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { language } = languageStore();
  const t = (en: string, bn: string): string => (language === "bn" ? bn : en);

  const handlePrint = () => {
    const tableEl = tableRef.current;
    if (!tableEl) return;

    let styles = "";
    document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
      styles += node.outerHTML;
    });

    const printHTML = `
      <html>
        <head>
          <title>Print</title>
          ${styles}
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
              * { background: white !important; background-color: white !important; box-shadow: none !important; }
              #no-print, .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${tableEl.innerHTML}
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(printHTML);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 500);
    };
  };

  return (
    <div className="overflow-x-auto w-full">
      {printEnable && (
        <div className="flex justify-end mb-2 no-print">
          <button onClick={handlePrint} className="global_button flex items-center gap-1">
            <Printer size={14} />
            <span>{t("Print", "প্রিন্ট")}</span>
          </button>
        </div>
      )}
      <div ref={tableRef}>
      {printHeader && <div className="mb-3">{printHeader}</div>}
      <table className="global_table">
        <thead className="global_thead">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`global_th ${col.printHide ? "no-print" : ""} ${col.headerClassName ?? col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="global_tbody">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-6 text-sm opacity-50">
                {t("No data found", "কোনো ডেটা পাওয়া যায়নি")}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={keyExtractor(row, rowIndex)} className={`global_tr ${rowClassName?.(row) ?? ""}`}> {/* ✅ rowIndex */}
                {columns.map((col, i) => (
                  <td key={i} className={`global_td ${col.printHide ? "no-print" : ""} ${col.className ?? ""}`}>
                    {typeof col.accessor === "function"
                      ? col.accessor(row, rowIndex)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
            {/* 👇 footer */}
         {footer && footer(columns.length)}
      </table>
      </div>
    </div>
  );
}