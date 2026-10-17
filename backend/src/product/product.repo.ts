import {
  Product,
  ProductPayload,
  UpdateProductInput,
} from "./product.type";
import { productTable } from "./product.table";
import db, { QueryClient } from "../../drizzle/src";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ne,
  sql,
} from "drizzle-orm";
import { paginateQuery } from "../../utils/queryBuilder";

export default class ProductRepository {
  static async findByField<K extends keyof Product>(
    fieldName: K,
    fieldVal: Product[K],
  ) {
    const [product] = await db
      .select()
      .from(productTable)
      .where(eq(productTable[fieldName] as any, fieldVal as any));

    return product ?? null;
  }

  static async findByFieldExceptId<K extends keyof Product>(
    fieldName: K,
    fieldVal: Product[K],
    excludeId: number,
  ) {
    const [product] = await db
      .select()
      .from(productTable)
      .where(
        and(
          eq(productTable[fieldName] as any, fieldVal as any),
          ne(productTable.id, excludeId),
        ),
      );

    return product ?? null;
  }

  static async findByID(
    productID: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .select()
      .from(productTable)
      .where(eq(productTable.id, productID))
      .limit(1);

    return product ?? null;
  }


  static async countProduct<K extends keyof Product>(
    fieldName: K,
    fieldVal: Product[K],
    client: QueryClient = db,
  ): Promise<number> {
    const [result] = await client
      .select({
        total: count(),
      })
      .from(productTable)
      .where(eq(productTable[fieldName] as any, fieldVal as any));

    return Number(result.total);
  }

  static async createProduct(
    payload: ProductPayload,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .insert(productTable)
      .values(payload)
      .returning();

    return product ?? null;
  }


  static async updateProduct(
    productID: number,
    payload: UpdateProductInput,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set(payload)
      .where(eq(productTable.id, productID))
      .returning();

    return product ?? null;
  }

  static async FullStructuredProductByID(
    productID: number,
    client: QueryClient = db,
  ) {
    return client.query.productTable.findFirst({
      where: eq(productTable.id, productID),
    });
  }

  static async list(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {

    return paginateQuery({
      db,
      query: db.query.productTable,
      countTable: productTable,
      orderBy:desc(productTable.updatedAt),
      page: query.page,
      limit: query.limit,
      search: query.search,
      searchColumns: [productTable.name],
     columns: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
        discountPrice: true,
        purchasePrice: true,
        totalSold: true,
        createdAt: true,
      },
    });
  }


  static async increaseProductStock(
    productID: number,
    qty: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set({
        stock: sql`${productTable.stock} + ${qty}`,
      })
      .where(eq(productTable.id, productID))
      .returning();

    return product ?? null;
  }
  static async decreaseProductStock(
    productID: number,
    qty: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set({
        stock: sql`${productTable.stock} - ${qty}`,
      })
      .where(eq(productTable.id, productID))
      .returning();

    return product ?? null;
  }

  /**
   * Conditionally decrements stock only when enough is available.
   *
   * The guard lives in the UPDATE itself (`stock >= qty`) so two concurrent
   * sales cannot both pass a separate "check then update" and oversell. The
   * row lock taken by the UPDATE serialises them; the loser returns `null`.
   */
  static async decreaseProductStockIfAvailable(
    productID: number,
    qty: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set({
        stock: sql`${productTable.stock} - ${qty}`,
      })
      .where(
        and(
          eq(productTable.id, productID),
          gte(productTable.stock, qty),
        ),
      )
      .returning();

    return product ?? null;
  }

  static async increaseProductSoldQty(
    productID: number,
    qty: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set({
        totalSold: sql`${productTable.totalSold} + ${qty}`,
      })
      .where(eq(productTable.id, productID))
      .returning();
    return product ?? null;
  }

  static async decreaseProductSoldQty(
    productID: number,
    qty: number,
    client: QueryClient = db,
  ): Promise<Product | null> {
    const [product] = await client
      .update(productTable)
      .set({
        totalSold: sql`${productTable.totalSold} - ${qty}`,
      })
      .where(eq(productTable.id, productID))
      .returning();
    return product ?? null;
  }


  static async lowStockProductList(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return paginateQuery({
      db,
      query: db.query.productTable,
      countTable: productTable,
      page: query.page,
      limit: query.limit,
      search: query.search,
      searchColumns: [productTable.name],
      where: [
        and(
          sql`${productTable.stock} <= ${productTable.alertQty} AND ${productTable.stock} > 0` // stock <= alertQty
        )!
      ],
     columns: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
        discountPrice: true,
        purchasePrice: true,
        totalSold: true,
        createdAt: true,
      },
    });
  }

  static async stockOutProductList(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return paginateQuery({
      db,
      query: db.query.productTable,
      countTable: productTable,
      page: query.page,
      limit: query.limit,
      search: query.search,
      searchColumns: [productTable.name],
      where: [
        and(
          sql`${productTable.stock} <= 0` // stock <= alertQty
        )!
      ],
      columns: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
        discountPrice: true,
        purchasePrice: true,
        totalSold: true,
        createdAt: true,
      },
    });
  }

}
