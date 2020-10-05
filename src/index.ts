import * as dotenv from "dotenv"
import express, {Response} from "express";
import bodyParser from "body-parser";
import axios, {AxiosRequestConfig} from "axios";

import AuthRoutes from "./auth/router";

dotenv.config();

const port = process.env.PORT || 8080;
const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended:true }) );
app.use('/auth', AuthRoutes());
app.use('/health', (_, res: Response) => res.status(200).send({status: "up"}));


app.listen(port, () => console.log(`Running on port ${port}`));
