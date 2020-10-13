"use strict"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value) }) }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
        function rejected(value) { try { step(generator["throw"](value)) } catch (e) { reject(e) } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected) }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod }
}
Object.defineProperty(exports, "__esModule", { value: true })
const redis_1 = __importDefault(require("redis"))
class RedisDatabase {
    constructor(host = "redis", port = 6379) {
        this.connect = () => __awaiter(this, void 0, void 0, function* () {
            this.client = yield redis_1.default.createClient(this.port, this.host)
            this.client.on("connect", function () {
                console.log("Redis Connected!")
            })
            this.client.on("error", function (err) {
                console.log("Redis Error!", err)
            })
        })
        this.isConnected = () => __awaiter(this, void 0, void 0, function* () {
            let out
            yield this.client.set("test", "is up")
            yield this.client.get("test", (err, res) => {
                out = res
            })
            console.log("ASDF", out)
        })
        this.host = host
        this.port = port
    }
}
exports.default = RedisDatabase
//# sourceMappingURL=redis.js.map