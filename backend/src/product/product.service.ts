import { ApiError } from "../../utils/ApiError";
import ProductRepository from "./product.repo";
import {
  CreateProductInput,
  Product,
  UpdateProductInput,

} from "./product.type";
import { QueryClient } from "../../drizzle/src";
import { withTransaction } from "../../utils/withTransaction";

export default class ProductService {


  static async create(payload: CreateProductInput): Promise<Product> {
    const exist = await ProductRepository.findByField("name", payload.name);

    if (exist) {
      throw new ApiError(400, "Product already exists with this name");
    }

    const product = await withTransaction(async (tx) => {
      const created = await ProductRepository.createProduct(
        { ...payload },
        tx,
      );

      if (!created) {
        throw new ApiError(500, "Product creation failed");
      }

      return created;
    });

    return product;
  }

  static async update(id: number, payload: UpdateProductInput): Promise<Product | null> {
    const productInput = payload;
    const hasProductFields =
      productInput && Object.keys(productInput).length > 0;

    if (!hasProductFields) {
      return ProductRepository.findByID(id);
    }

    return withTransaction(async (tx) => {
      if (productInput.name) {
        const exist = await ProductRepository.findByFieldExceptId(
          "name",
          productInput.name,
          id,
        );

        if (exist) {
          throw new ApiError(400, "Product already exists with this name");
        }
      }

      const product = await ProductRepository.updateProduct(
        id,
        { ...productInput } as UpdateProductInput,
        tx,
      );

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      return product;
    });
  }

  static async lowStockProductList(query: any) {
    const result = await ProductRepository.lowStockProductList(query);
    return result;
  }

    static async stockOutProductList(query: any) {
    const result = await ProductRepository.stockOutProductList(query);
    return result;
  }
  static async list(query: any) {
    const result = await ProductRepository.list(query);
    return result;
  }

  static async structuredProductByID(id: number) {
    const product = await ProductRepository.FullStructuredProductByID(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return product;
  }
  static async findById(
    productID: number,
    tx?: QueryClient,
  ): Promise<Product | null> {
    return ProductRepository.findByID(productID, tx);
  }


  static async updatePosProduct(id: number) {
    const product = await ProductRepository.findByID(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

  }

  static async countProduct(fieldName: any, fieldVal: any, tx?: QueryClient) {
    return await ProductRepository.countProduct(fieldName, fieldVal, tx);
  }
  static async decreaseProductStock(
    productID: number,
    qty: number,
    tx?: QueryClient,
  ) {
    return await ProductRepository.decreaseProductStock(productID, qty, tx);
  }

  static async decreaseProductStockIfAvailable(
    productID: number,
    qty: number,
    tx?: QueryClient,
  ) {
    return await ProductRepository.decreaseProductStockIfAvailable(productID, qty, tx);
  }



  static async increaseProductStock(
    productID: number,
    qty: number,
    tx?: QueryClient,
  ) {
    return await ProductRepository.increaseProductStock(productID, qty, tx);
  }

  static async increaseProductSoldQty(
    productID: number,
    qty: number,
    tx?: QueryClient,
  ) {
    return await ProductRepository.increaseProductSoldQty(productID, qty, tx);
  }


  static async decreaseProductSoldQty(
    productID: number,
    qty: number,
    tx?: QueryClient,
  ) {
    return await ProductRepository.decreaseProductSoldQty(productID, qty, tx);
  }

}
