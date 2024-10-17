import { LinkedTxn, LineLinkedTxn } from "./linked-txn";

export interface BillQboData {
  Id?: string,
  SyncToken?: string,
  MetaData?: {
    CreateTime?: string,
    LastUpdatedTime?: string
  },
  DocNumber?: string,
  VendorRef?: {
    value: string,
    name?: string
  },

  Line?: BillLineQboData[],
  LinkedTxn?: LinkedTxn[]
}

export interface BillLineQboData {
  Amount?: number,
  Description?: string,
  DetailType?: "ItemBasedExpenseLineDetail",
  ItemBasedExpenseLineDetail: {
    ItemRef: {
      name?: string,
      value: string
    },
    UnitPrice: number,
    Qty: number
  },
  LinkedTxn: LineLinkedTxn[]
}
