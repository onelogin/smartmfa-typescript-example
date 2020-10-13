"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SimpleDatabase {
    constructor(table) {
        this.Upsert = (entry) => {
            this.table[entry.id] = entry;
            return this.table[entry.id];
        };
        this.Read = (id) => {
            return this.table[id];
        };
        this.Index = () => {
            return Object.keys(this.table).map(k => this.table[k]);
        };
        this.Delete = (id) => {
            delete this.table[id];
            return true;
        };
        this.table = table;
    }
}
exports.default = SimpleDatabase;
//# sourceMappingURL=simple_db.js.map