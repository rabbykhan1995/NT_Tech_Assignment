import { and, asc, eq, desc } from "drizzle-orm";
import db, { QueryClient } from "../../drizzle/src";
import { supplierProductTable } from "./supplier_product.table";
import type {
  SupplierProduct,
  SupplierProductPayload,
  UpdateSupplierProductInput,
} from "./supplier_product.type";

export default class SupplierProductRepository {
  static async findByPair(
    supplierID: number,
    productID: number,
    client: QueryClient = db,
  ): Promise<SupplierProduct | null> {
    const [row] = await client
      .select()
      .from(supplierProductTable)
      .where(
        and(
          eq(supplierProductTable.supplierID, supplierID),
          eq(supplierProductTable.productID, productID),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async findByID(
    id: number,
    client: QueryClient = db,
  ): Promise<SupplierProduct | null> {
    const [row] = await client
      .select()
      .from(supplierProductTable)
      .where(eq(supplierProductTable.id, id))
      .limit(1);

    return row ?? null;
  }

  static async create(
    payload: SupplierProductPayload,
    client: QueryClient = db,
  ): Promise<SupplierProduct | null> {
    const [row] = await client
      .insert(supplierProductTable)
      .values(payload)
      .returning();

    return row ?? null;
  }

  static async update(
    id: number,
    payload: UpdateSupplierProductInput,
    client: QueryClient = db,
  ): Promise<SupplierProduct | null> {
    const [row] = await client
      .update(supplierProductTable)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(supplierProductTable.id, id))
      .returning();

    return row ?? null;
  }

  static async remove(
    id: number,
    client: QueryClient = db,
  ): Promise<SupplierProduct | null> {
    const [row] = await client
      .delete(supplierProductTable)
      .where(eq(supplierProductTable.id, id))
      .returning();

    return row ?? null;
  }

  /** All supplier relationships for a product. */
  static async listByProduct(
    productID: number,
    client: QueryClient = db,
  ) {
    return client.query.supplierProductTable.findMany({
      where: eq(supplierProductTable.productID, productID),
      orderBy: [desc(supplierProductTable.isPreferred), asc(supplierProductTable.purchasePrice)],
      with: {
        supplier: true,
      },
    });
  }

  /** All product relationships for a supplier. */
  static async listBySupplier(
    supplierID: number,
    client: QueryClient = db,
  ) {
    return client.query.supplierProductTable.findMany({
      where: eq(supplierProductTable.supplierID, supplierID),
      orderBy: asc(supplierProductTable.productID),
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            stock: true,
          },
        },
      },
    });
  }
}
