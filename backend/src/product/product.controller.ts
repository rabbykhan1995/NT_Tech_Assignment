import { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import ProductService from "./product.service";


export class ProductController {
  constructor() {
    // যদি future এ dependency inject করতে চাও, এখানে রাখা যাবে
  }
  // Create Product
  static async create(req: Request, res: Response) {
    const product = await ProductService.create(req.body);

    // triggerRevalidation(HOME_SECTION_TAGS);

    res.status(201).json({
      success: true,
      data: product,
      msg: "Product Created Successfully",
    });
  }
  // update Product
  static async update(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new ApiError(400, "Invalid product id");
    }

    const product = await ProductService.update(id, req.body);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    res.status(200).json({
      success: true,
      data: product,
      msg: "Product updated successfully",
    });
  }
  // List Products
  static async list(req: Request, res: Response) {

    const result = await ProductService.list(req.query);
    //  I want to send response with the unitname, categoryname and brandname including..
    return res.status(200).json({ success: true, data: result });
  }


  static async productByID(req: Request, res: Response) {
    const { id } = req.params;

    const product = await ProductService.structuredProductByID(Number(id));

    res.status(200).json({ success: true, data: product });
  }

}
