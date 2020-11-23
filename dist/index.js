"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const sdk_1 = require("@onelogin/sdk");
const router_1 = __importDefault(require("./auth/router"));
const simple_db_1 = __importDefault(require("./database/simple_db"));
dotenv.config();
const db = new simple_db_1.default({});
// here's an existing user who hasn't registered mfa with OneLogin.
// added to simulate experience of adding mfa to app with existing data.
// Should get prompted for otp.
db.Upsert({
    id: "test@onelogin.com",
    email: "test@onelogin.com",
    password: "12345",
    phone: "13125551234",
});
const onelogin = new sdk_1.Client({
    clientID: process.env.ONELOGIN_CLIENT_ID,
    clientSecret: process.env.ONELOGIN_CLIENT_SECRET,
    baseURL: process.env.ONELOGIN_API_URL,
    timeout: 30000
});
const port = process.env.PORT || 8080;
const app = express_1.default();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use('/auth', router_1.default({ dataStore: db, external: { onelogin } }));
app.use('/health', (_, res) => res.status(200).send({ status: "up" }));
app.listen(port, () => console.log(`Running on port ${port}`));
//# sourceMappingURL=index.js.map