import { ApiError } from "../../utils/ApiError";
import ContactService from "../contact/contact.service";
import ProductService from "../product/product.service";
import { CreateSaleInput, Sale, } from "./sale.type";
import { saleTable } from "./sale.table";
import SaleRepository from "./sale.repo";
import LedgerService from "../ledger/ledger.service";
import { withTransaction } from "../../utils/withTransaction";
import { QueryClient } from "../../drizzle/src";
import { Contact } from "../contact/contact.type";
import { LedgerPayload } from "../ledger/ledger.type";

export default class SaleService {
    static async create(payload: CreateSaleInput) {
        const sale = payload.sale;
        const products = payload.products;

        let customer: Contact | null = null;

        if (sale.customerID) {
            customer = await ContactService.findByID(sale.customerID);
            if (!customer) throw new ApiError(404, "Customer not found");
        }

        // Validate quantities and product references before opening a transaction.
        for (const item of products) {
            if (!Number.isFinite(item.soldQty) || item.soldQty <= 0) {
                throw new ApiError(400, "Sold quantity must be greater than 0");
            }

            const product = await ProductService.findById(item.productID);
            if (!product) {
                throw new ApiError(404, `Product not found (id: ${item.productID})`);
            }

            if (Number(product.stock) < item.soldQty) {
                throw new ApiError(
                    400,
                    `Insufficient stock for product "${product.name}". Available: ${product.stock}, requested: ${item.soldQty}`,
                );
            }
        }

        const saleCreated = await withTransaction(async (tx: QueryClient) => {
            // 1. Reserve a unique invoice number atomically.
            const invoiceNo = await SaleRepository.getNextInvoiceNo(tx);

            // 2. Create the sale header.
            const created = await SaleRepository.create(
                {
                    ...sale,
                    invoiceNo,
                },
                tx,
            );

            // 3. Create line items and deduct stock. Sequential on purpose:
            //    a single transaction shares one connection.
            for (const item of products) {
                const decremented = await ProductService.decreaseProductStockIfAvailable(
                    item.productID,
                    item.soldQty,
                    tx,
                );

                // Guard runs inside the UPDATE, so this also protects against a
                // concurrent sale consuming the stock between our check and now.
                if (!decremented) {
                    throw new ApiError(
                        400,
                        `Insufficient stock for product id ${item.productID}`,
                    );
                }

                await ProductService.increaseProductSoldQty(item.productID, item.soldQty, tx);

                await SaleRepository.createSaleItem(
                    {
                        saleID: created.id,
                        productID: item.productID,
                        salePrice: item.salePrice,
                        soldQty: item.soldQty,
                    },
                    tx,
                );
            }

            const actualPaid: number = sale.paid;

            // 4. Ledger entry for the customer receivable.
            if (customer) {
                const payableAmount: number = sale.totalAmount;
                const ledgerPayload: LedgerPayload = {
                    type: "sale",
                    saleID: created.id,
                    contactID: customer.id,
                    amount: payableAmount,
                    discount: sale.discount,
                    paidAmount: actualPaid,
                    note: sale.note ?? "",
                    date: sale.saleDate,
                };

                await LedgerService.create(ledgerPayload, tx);
            }

            return created;
        })

        return saleCreated;
    }

    static async list(query: any) {
        return await SaleRepository.list(query);
    }

    static async saleInvoiceByID(saleID: number) {

        const sale = await SaleRepository.getSaleByID(saleID);

        if (!sale) {

            throw new ApiError(404, "sale not found");

        }


        const saleProducts = await SaleRepository.getSoldProductsBySaleID(saleID);
        return {

            sale,

            products: saleProducts,

        }

    }


    static async getSaleByID(saleID: number) {
        return await SaleRepository.getSaleByID(saleID);
    }

    static async update(saleID: number, data: Partial<typeof saleTable.$inferInsert>, tx?: QueryClient) {
        return await SaleRepository.update(saleID, data, tx);
    }

}
