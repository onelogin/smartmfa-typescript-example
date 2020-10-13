export interface DBItem {
  id: string;
};

export interface Database<T> {
  Upsert(entry: T): T;
  Read(id: string): T;
  Index(): T[];
  Delete(id: string): boolean;
}
