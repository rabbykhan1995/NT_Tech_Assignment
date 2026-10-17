import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import SupplierProductService from "./supplier_product.service";

function parseID(raw: string | string[], label: string): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label} id`);
  }
  return id;
}

export class SupplierProductController {
  static async create(req: Request, res: Response) {
    const relationship = await SupplierProductService.create(req.body);

    res.status(201).json({
      success: true,
      data: relationship,
      msg: "Supplier-product relationship created successfully",
    });
  }

  static async update(req: Request, res: Response) {
    const id = parseID(req.params.id, "supplier-product relationship");
    const relationship = await SupplierProductService.update(id, req.body);

    res.status(200).json({
      success: true,
      data: relationship,
      msg: "Supplier-product relationship updated successfully",
    });
  }

  static async listByProduct(req: Request, res: Response) {
    const productID = parseID(req.params.productID, "product");
    const relationships = await SupplierProductService.listByProduct(productID);

    res.status(200).json({ success: true, data: relationships });
  }

  static async listBySupplier(req: Request, res: Response) {
    const supplierID = parseID(req.params.supplierID, "supplier");
    const relationships = await SupplierProductService.listBySupplier(supplierID);

    res.status(200).json({ success: true, data: relationships });
  }

  static async remove(req: Request, res: Response) {
    const id = parseID(req.params.id, "supplier-product relationship");
    await SupplierProductService.remove(id);

    res.status(200).json({
      success: true,
      msg: "Supplier-product relationship removed successfully",
    });
  }
}
