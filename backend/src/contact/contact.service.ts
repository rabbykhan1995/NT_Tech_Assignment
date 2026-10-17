
import ContactRepository from "./contact.repo";
import { Contact, CreateContactInput, UpdateContactInput } from "./contact.type";
import { ApiError } from "../../utils/ApiError";
import { QueryClient } from "../../drizzle/src";

export default class ContactService {
    // NOTE:this will not be return any error res from here findByID
    static async findByID(contactID: number): Promise<Contact | null> {

        const contact: Contact | null = await ContactRepository.findByID(contactID);

        return contact;
    }

  static async findOne(
    where: Partial<{
      id: string;
      userID: string;
      email: string;
      mobile: string;
    }>,
    tx?:QueryClient
  ) {
    return ContactRepository.findOne(where,tx);
  }

    static async findByMobile(mobile: string): Promise<Contact> {

        const contact: Contact | null = await ContactRepository.findByMobile(mobile);

        if (!contact) {
            throw new ApiError(404, "Contact not found");
        }
        return contact;
    }

    static async create(payload: CreateContactInput, tx?:QueryClient): Promise<Contact> {
        const exists = await ContactRepository.findByMobile(payload.mobile);

        if (exists) {
            throw new ApiError(401, "Contact already exist with this number");
        }

        const contact = await ContactRepository.create({ ...payload },tx);

        if (!contact) {
            throw new ApiError(401, "Contact Creation failed");
        }
        return contact;

    }

    static async update(contactID: number, payload: UpdateContactInput, tx?:QueryClient): Promise<Contact> {


        const contact: Contact | null = await ContactRepository.findByID(contactID);

        if (!contact) {
            throw new ApiError(404, "Contact not found");
        }

        const updated: Contact | null = await ContactRepository.findByIDAndUpdate(contactID, payload, tx);



        if (!updated) {
            throw new ApiError(401, "Contact Update failed");
        }

        return updated;

    }

    static async list(query: any) {

        return ContactRepository.list(
            query
        );
    }

}