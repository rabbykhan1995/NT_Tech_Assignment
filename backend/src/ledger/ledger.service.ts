import LedgerRepository from "./ledger.repo";
import { QueryClient } from "../../drizzle/src";
import { LedgerPayload } from "./ledger.type";

export default class LedgerService {
  constructor() { }

  static async create(
    payload: LedgerPayload,
    tx?: QueryClient
  ){

    const ledger = await LedgerRepository.create(payload, tx);

    return ledger;
  }
  static async list(query:any){
    return await LedgerRepository.list(query);
  }
  static async findByID(ledgerID:number, tx?:QueryClient){
    return await LedgerRepository.findByID(ledgerID,tx)
  }
}