import express, {Request, Response} from 'express';
import axios from 'axios'
import AuthOneLogin from '../middleware/onelogin'

import { Database } from "../database/db_interfaces";
import { User } from "../models/user";

const AuthRoutes = (db: Database<User>) => {
  const router = express.Router();
  const authRouter = new AuthRouter(db);
  router.use(AuthOneLogin);
  router.post('/login', authRouter.loginRoute);
  router.post('/signup', authRouter.signupRoute);
  router.post('/otp', authRouter.otpRoute);
  return router;
}

class AuthRouter {
  db: Database<User>
  constructor(db: Database<User>) {
    this.db = db;
  }
  // Lets begin by registering a user to your app. This will collect a user's
  // username and phone number. You can also collect a password or other information
  // but for the purpose of the demo we'll focus on username and phone number.
  signupRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields(req.body, ["user_identifier", "phone", "password"]);
    if( missingFields ) return res.status(400).json({ error: missingFields });

    try {
      let existingUser = this.db.Read(req.body.user_identifier);
      if( existingUser ) return res.status(400).json({ error: `User with id ${req.body.user_identifier} exists!` });

      let {user_identifier, phone, password} = req.body;
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      };

      let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
      let headers = { 'Authorization': `Bearer ${req.olBearerToken}`, 'Content-Type': 'application/json' };
      let payload = { user_identifier, phone, context };

      let { status, data } = await axios.post( url, payload, { headers } );

      this.db.Upsert({ phone, password, id: user_identifier, userIdentifier: user_identifier });

      // data.mfa looks like {otp_sent: true, state_token: 12345}
      res.status(status).json(data.mfa);

    } catch(err) {
      console.log("Error", err.response.data);
      res.status(err.response.status).send(err.response.data);
    }
  }

  // This is called when a user attempts to log in with their username.
  loginRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields(req.body, ["user_identifier", "password"]);
    if( missingFields ) return res.status(400).json({ error: missingFields });

    try {
      let user = this.db.Read(req.body.user_identifier);
      if( !user ) return res.status(400).json({ error: `User with id ${req.body.user_identifier} not found!` });

      // DO NOT store plaintext passwords or compare them like this. FOR DEMO PURPOSES ONLY!
      if( user.password != req.body.password ) return res.status(400).json({ error: `Wrong password` });

      let {userIdentifier: user_identifier, phone} = user;
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      };

      let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
      let headers = { 'Authorization': `Bearer ${req.olBearerToken}`, 'Content-Type': 'application/json' };
      let payload = { user_identifier, phone, context };

      let { status, data } = await axios.post( url, payload, { headers } );

      res.status(status).json(data.mfa);

    } catch(err) {
      console.log("Error", err.response.data);
      res.status(err.response.status).send(err.response.data);
    }
  }

  // This is where you'd send the otp collected from the user in the calling app and
  // the state_token to validate the second factor
  otpRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields(req.body, ["otp_token", "state_token"]);
    if( missingFields ) return res.status(400).json({ error: missingFields });

    try {
      let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/verify`;
      let headers = {
        'Authorization': `Bearer ${req.olBearerToken}`,
        'Content-Type': 'application/json'
      };

      let { status, data } = await axios.post( url, req.body, { headers } );

      res.status(status).json(data);

    } catch(err) {
      console.log("Error", err.response.data);
      res.status(err.response.status).send(err.response.data);
    }
  }

  // scans the request object for the required fields given.
  // returns an error if a field is missing
  requiredFields = (req: object, fields: string[]): object => {
    let missingFields: Array<string> = [];
    fields.forEach(field => {
      if( !req.hasOwnProperty(field) ) {
        missingFields.push(field);
      }
    });
    if( missingFields.length > 0 ) return { message: `required fields ${missingFields.join(" ")} are missing` };
  }

}
export default AuthRoutes;
