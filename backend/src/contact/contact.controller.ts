import { Request, Response } from "express";
import { CreateContactInput, UpdateContactInput } from "./contact.type";
import ContactService from "./contact.service";

export class ContactController {

  static async create(req: Request, res: Response) {
    const data: CreateContactInput = req.body;



    const contact = await ContactService.create(data);

    res.status(201).json({
      success: true,
      data: contact,
      msg: "Contact created successfully"
    });
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const data: UpdateContactInput = req.body;

    const contact = await ContactService.update(Number(id), data);



    res.status(200).json({
      success: true,
      data: contact,
      msg: "Contact updated successfully"
    });
  }

  static async getContactByID(req: Request, res: Response) {
    const { id } = req.params;

    const contact = await ContactService.findByID(Number(id));


    res.status(200).json({
      success: true,
      data:contact
    });
  }

 static async list(req: Request, res: Response) {

  const result =
    await ContactService.list(req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
}
}