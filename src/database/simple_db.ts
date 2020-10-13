import { User } from "../models/user";
import { Database, DBItem } from "./db_interfaces";

class SimpleDatabase<T extends DBItem> implements Database<T> {
  table: { [id: string]: T };

  constructor(table: {[id: string]: T}){
    this.table = table;
  }

  Upsert = (entry: T): T => {
    this.table[entry.id] = entry;
    return this.table[entry.id];
  }

  Read = (id: string): T => {
    return this.table[id];
  }

  Index = (): T[] => {
    return Object.keys(this.table).map(k => this.table[k]);
  }

  Delete = (id: string): boolean => {
    delete this.table[id];
    return true;
  }
}

export default SimpleDatabase;
