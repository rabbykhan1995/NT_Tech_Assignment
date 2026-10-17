import { ApiError } from "../../utils/ApiError";
import ContactService from "../contact/contact.service";
import { CreatePurchaseInput, Purchase } from "./purchase.type";
import PurchaseRepository from "./purchase.repo";
import ProductService from "../product/product.service";

import LedgerService from "../ledger/ledger.service";
import { QueryClient } from "../../drizzle/src";
import { withTransaction } from "../../utils/withTransaction";
import { LedgerPayload } from "../ledger/ledger.type";

export default class PurchaseService {
  static async create(payload: CreatePurchaseInput) {
    const purchase = payload.purchase;
    const products = payload.products;

    const supplier = await ContactService.findByID(purchase.supplierID);
    if (!supplier) throw new ApiError(404, "Supplier not found");

    // Validate every referenced product and quantity up-front so we never
    // open a transaction for an obviously invalid request.
    for (const item of products) {
      if (!Number.isFinite(item.purchasedQty) || item.purchasedQty <= 0) {
        throw new ApiError(400, "Purchased quantity must be greater than 0");
      }

      const product = await ProductService.findById(item.id);
      if (!product) {
        throw new ApiError(404, `Product not found (id: ${item.id})`);
      }
    }

    const balanceAfter =
      purchase.totalAmount +
      purchase.balanceBefore -
      (purchase.paid - (purchase.exchangeAmount || 0));

    const purchaseCreated = await withTransaction(async (tx: QueryClient) => {
      // 1. Reserve a unique invoice number atomically.
      const invoiceNo = await PurchaseRepository.getNextInvoiceNo(tx);

      // 2. Create the purchase header.
      const created: Purchase = await PurchaseRepository.purchaseCreate(
        {
          ...purchase,
          balanceAfter,
          invoiceNo,
        },
        tx,
      );

      // 3. Persist line items and increase stock. This is a deliberately
      //    sequential loop: a single transaction uses one connection and
      //    concurrent queries on it are not safe.
      for (const item of products) {
        await PurchaseRepository.createPurchaseItem(
          {
            purchaseID: created.id,
            productID: item.id,
            purchasedQty: item.purchasedQty,
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
            warranty: item.warranty ?? 0,
            expireDate: item.expireDate ?? null,
          },
          tx,
        );

        const updated = await ProductService.increaseProductStock(
          item.id,
          item.purchasedQty,
          tx,
        );

        if (!updated) {
          throw new ApiError(404, `Product not found (id: ${item.id})`);
        }
      }

      // 4. Ledger entry for the payable to the supplier.
      const actualPaid: number = purchase.paid;
      const payableAmount: number = purchase.totalAmount;

      const ledgerPayload: LedgerPayload = {
        contactID: purchase.supplierID,
        type: "purchase",
        amount: payableAmount,
        date: purchase.purchaseDate,
        discount: purchase.discount,
        purchaseID: created.id,
        note: purchase.note,
        paidAmount: actualPaid,
      };

      await LedgerService.create(ledgerPayload, tx);

      return created;
    });

    return purchaseCreated;
  }

  static async purchaseInvoiceByID(
    purchaseID: number
  ) {
    const purchase = await PurchaseRepository.purchaseInvoiceByID(purchaseID);
    if (!purchase) {
      throw new ApiError(404, "purchase  not found");
    }

    return purchase;
  }


  static async purchaseForReturnByID(
    purchaseID: number
  ) {

    return await PurchaseRepository.purchaseForReturnByID(purchaseID)

  }

  static async purchaseByID(id: number, tx?: QueryClient) {
    return await PurchaseRepository.findByID(id, tx);
  }

  static async list(query: any) {
    return await PurchaseRepository.list(query);
  }

  static async purchaseUpdateDynamic(id: number,
    payload: Partial<Purchase>,
    tx?: QueryClient) {
    return await PurchaseRepository.purchaseUpdateDynamic(id,
      payload,
      tx);
  }
}
