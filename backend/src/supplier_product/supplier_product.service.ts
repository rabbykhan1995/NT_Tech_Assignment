import { ApiError } from "../../utils/ApiError";
import ContactService from "../contact/contact.service";
import ProductService from "../product/product.service";
import SupplierProductRepository from "./supplier_product.repo";
import type {
  CreateSupplierProductInput,
  UpdateSupplierProductInput,
} from "./supplier_product.type";

export default class SupplierProductService {
  static async create(payload: CreateSupplierProductInput) {
    const supplier = await ContactService.findByID(payload.supplierID);
    if (!supplier) {
      throw new ApiError(404, "Supplier not found");
    }

    const product = await ProductService.findById(payload.productID);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existing = await SupplierProductRepository.findByPair(
      payload.supplierID,
      payload.productID,
    );
    if (existing) {
      throw new ApiError(
        409,
        "This supplier is already linked to this product",
      );
    }

    const created = await SupplierProductRepository.create({
      supplierID: payload.supplierID,
      productID: payload.productID,
      purchasePrice: payload.purchasePrice,
      leadTimeDays: payload.leadTimeDays,
      minOrderQty: payload.minOrderQty,
      supplierSKU: payload.supplierSKU ?? null,
      isPreferred: payload.isPreferred ?? false,
    });

    if (!created) {
      throw new ApiError(500, "Failed to create supplier-product relationship");
    }

    return created;
  }

  static async update(id: number, payload: UpdateSupplierProductInput) {
    const existing = await SupplierProductRepository.findByID(id);
    if (!existing) {
      throw new ApiError(404, "Supplier-product relationship not found");
    }

    const updated = await SupplierProductRepository.update(id, payload);
    if (!updated) {
      throw new ApiError(500, "Failed to update supplier-product relationship");
    }

    return updated;
  }

  static async listByProduct(productID: number) {
    const product = await ProductService.findById(productID);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return SupplierProductRepository.listByProduct(productID);
  }

  static async listBySupplier(supplierID: number) {
    const supplier = await ContactService.findByID(supplierID);
    if (!supplier) {
      throw new ApiError(404, "Supplier not found");
    }

    return SupplierProductRepository.listBySupplier(supplierID);
  }

  static async remove(id: number) {
    const removed = await SupplierProductRepository.remove(id);
    if (!removed) {
      throw new ApiError(404, "Supplier-product relationship not found");
    }
    return removed;
  }
}
