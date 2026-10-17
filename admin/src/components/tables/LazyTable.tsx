import React, { lazy, Suspense } from "react";
import SuspenseFallback from "../loader/SuspenseFallback";

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

const ActualTable = lazy(() => import("./Table"));

export default function LazyTable<T>(props: TableProps<T>) {
  return (
    <Suspense fallback={<SuspenseFallback height="h-40" />}>
      {/* @ts-expect-error — lazy generic forwarding */}
      <ActualTable {...props} />
    </Suspense>
  );
}
