import {Database, DBItem} from "./db_interfaces"

export default class SimpleDatabase<T extends DBItem> implements Database<DBItem> {
  table: {[id: string]: T}

  constructor(table: {[id: string]: T}) {
    this.table = table
  }

  Upsert = (entry: T): T => {
    this.table[entry.id] = entry
    return this.table[entry.id]
  }

  Read = (id: string): T => {
    return this.table[id]
  }

  Index = (): T[] => {
    return Object.keys(this.table).map(k => this.table[k])
  }

  Delete = (id: string): boolean => {
    delete this.table[id]
    return true
  }
}
