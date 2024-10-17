export interface LinkedTxn {
  TxnId: string,
  TxnType: string
}

export interface LineLinkedTxn {
  TxnType: string,
  TxnId: string,
  TxnLineId?: string
}
