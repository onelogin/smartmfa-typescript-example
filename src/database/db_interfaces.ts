export interface DBItem {
  id: string
}

export interface Database<DBItem>{
  Upsert(entry: DBItem): DBItem
  Read(id: string): DBItem
  Index(): DBItem[]
  Delete(id: string): boolean
}
