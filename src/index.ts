import * as dotenv from "dotenv"
import express, {Response} from "express";
import bodyParser from "body-parser";
import axios, {AxiosRequestConfig} from "axios";

import AuthRoutes from "./auth/router";
import SimpleDatabase from "./database/simple_db";
import { User } from "./models/user";

dotenv.config();
const db = new SimpleDatabase<User>({});

// here's an existing user who hasn't registered mfa with OneLogin.
// added to simulate experience of adding mfa to app with existing data.
// Should get prompted for otp.
db.Upsert({
  id: "test@onelogin.com",
  userIdentifier: "test@onelogin.com",
  password: "12345",
  phone: "13125551234", // for a good time, put your phone number here
})

const port = process.env.PORT || 8080;
const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended:true }) );
app.use('/auth', AuthRoutes(db));
app.use('/health', (_, res: Response) => res.status(200).send({status: "up"}));


app.listen(port, () => console.log(`Running on port ${port}`));
