import * as productSchema from "../src/product/product.table";
import * as saleSchema from "../src/sale/sale.table"
import * as saleItemsSchema from "../src/sale/sale_items.table"
import * as contactSchema from "../src/contact/contact.table"
import * as purchaseSchema from "../src/purchase/purchase.table"
import * as purchaseItemsSchema from "../src/purchase/purchase_items.table"
import * as supplierProductSchema from "../src/supplier_product/supplier_product.table"
import * as ledgerSchema from "../src/ledger/ledger.table"

// সব টেবিল এবং তাদের রিলেশন একসাথে কম্বাইন করা হলো
export const dbSchema = {
  ...productSchema,
  ...ledgerSchema,

  ...contactSchema,
  ...saleSchema,
  ...saleItemsSchema,
  ...purchaseSchema,
  ...purchaseItemsSchema,
  ...supplierProductSchema,
};
