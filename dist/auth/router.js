"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const onelogin_1 = __importDefault(require("../middleware/onelogin"));
const AuthRoutes = (db) => {
    const router = express_1.default.Router();
    const authRouter = new AuthRouter(db);
    router.use(onelogin_1.default);
    router.post('/login', authRouter.loginRoute);
    router.post('/signup', authRouter.signupRoute);
    router.post('/otp', authRouter.otpRoute);
    return router;
};
class AuthRouter {
    constructor(db) {
        // Lets begin by registering a user to your app. This will collect a user's
        // username and phone number. You can also collect a password or other information
        // but for the purpose of the demo we'll focus on username and phone number.
        this.signupRoute = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let missingFields = this.requiredFields(req.body, ["user_identifier", "phone", "password"]);
            if (missingFields)
                return res.status(400).json({ error: missingFields });
            try {
                let existingUser = this.db.Read(req.body.user_identifier);
                if (existingUser)
                    return res.status(400).json({ error: `User with id ${req.body.user_identifier} exists!` });
                let { user_identifier, phone, password } = req.body;
                let context = {
                    user_agent: req.headers["user-agent"],
                    ip: req.connection.remoteAddress
                };
                let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
                let headers = { 'Authorization': `Bearer ${req.olBearerToken}`, 'Content-Type': 'application/json' };
                let payload = { user_identifier, phone, context };
                let { status, data } = yield axios_1.default.post(url, payload, { headers });
                this.db.Upsert({ phone, password, id: user_identifier, userIdentifier: user_identifier });
                // data.mfa looks like {otp_sent: true, state_token: 12345}
                res.status(status).json(data.mfa);
            }
            catch (err) {
                console.log("Error", err.response.data);
                res.status(err.response.status).send(err.response.data);
            }
        });
        // This is called when a user attempts to log in with their username.
        this.loginRoute = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let missingFields = this.requiredFields(req.body, ["user_identifier", "password"]);
            if (missingFields)
                return res.status(400).json({ error: missingFields });
            try {
                let user = this.db.Read(req.body.user_identifier);
                if (!user)
                    return res.status(400).json({ error: `User with id ${req.body.user_identifier} not found!` });
                // DO NOT store plaintext passwords or compare them like this. FOR DEMO PURPOSES ONLY!
                if (user.password != req.body.password)
                    return res.status(400).json({ error: `Wrong password` });
                let { userIdentifier: user_identifier, phone } = user;
                let context = {
                    user_agent: req.headers["user-agent"],
                    ip: req.connection.remoteAddress
                };
                let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
                let headers = { 'Authorization': `Bearer ${req.olBearerToken}`, 'Content-Type': 'application/json' };
                let payload = { user_identifier, phone, context };
                let { status, data } = yield axios_1.default.post(url, payload, { headers });
                res.status(status).json(data.mfa);
            }
            catch (err) {
                console.log("Error", err.response.data);
                res.status(err.response.status).send(err.response.data);
            }
        });
        // This is where you'd send the otp collected from the user in the calling app and
        // the state_token to validate the second factor
        this.otpRoute = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let missingFields = this.requiredFields(req.body, ["otp_token", "state_token"]);
            if (missingFields)
                return res.status(400).json({ error: missingFields });
            try {
                let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/verify`;
                let headers = {
                    'Authorization': `Bearer ${req.olBearerToken}`,
                    'Content-Type': 'application/json'
                };
                let { status, data } = yield axios_1.default.post(url, req.body, { headers });
                res.status(status).json(data);
            }
            catch (err) {
                console.log("Error", err.response.data);
                res.status(err.response.status).send(err.response.data);
            }
        });
        // scans the request object for the required fields given.
        // returns an error if a field is missing
        this.requiredFields = (req, fields) => {
            let missingFields = [];
            fields.forEach(field => {
                if (!req.hasOwnProperty(field)) {
                    missingFields.push(field);
                }
            });
            if (missingFields.length > 0)
                return { message: `required fields ${missingFields.join(" ")} are missing` };
        };
        this.db = db;
    }
}
exports.default = AuthRoutes;
//# sourceMappingURL=router.js.map