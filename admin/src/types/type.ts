


export type SelectOption<T = Record<string, unknown>> = {
  value: string;
  label: string;
} & T;


export type SearchParams = {
  search: string;
  page: number;
  limit: number;
};

export type Product = {
  id: number;
  name: string;
  stock: number;
  createdAt: string;
  purchasePrice: number;
  salePrice: number;
};



export type PurchaseProduct = {
  id: number;
  name: string;
  stock: number;
  createdAt: string;
  purchasePrice: number;
  salePrice: number;
  purchaseQty: number;
};


export type SaleProduct = {
  purchaseID?: number;
  productID: number;
  name: string;
  stock: number;
  createdAt: string;
  purchasePrice: number;
  salePrice: number;
  soldQty: number;
  total: number;
};



export type Contact = {
  id: number;
  name: string;
  mobile: string
  address?: string;
  createdAt: string;
};


export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};


export type PurchaseListItem = {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  paid: number;
  purchaseDate: Date;
  createdAt: Date;
  supplierName?: string;
  discount: number;
  supplier: {
    name: string;
  }
};



export type SaleListItem = {
  id: number;
  invoiceNo: string;
  totalAmount: number;
  paid: number;
  saleDate: Date;
  createdAt: Date;
  otherCost?: number;
  discount: number;

};


export type LedgerListItem = {
  id: number;
  type: "purchase" | "sale" | "purchase_return" | "sale_return" | "payment_in" | "payment_out";

  saleID: number | null;
  purchaseID: number | null;
  saleReturnID: number | null;
  purchaseReturnID: number | null;
  paymentID: number | null;
  contactID: number | null;

  amount: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;

  balanceBefore: number;
  balanceAfter: number;

  note: string;

  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

