import express, {Request, Response} from 'express';
import axios from 'axios'
import AuthOneLogin from '../middleware/onelogin'

const AuthRoutes = () => {
  const router = express.Router();
  router.use(AuthOneLogin);
  router.post('/login', loginRoute);
  router.post('/signup', signupRoute);
  router.post('/otp', otpRoute);
  return router;
}

// Lets begin by registering a user to your app. This will collect a user's
// username and phone number. You can also collect a password or other information
// but for the purpose of the demo we'll focus on username and phone number.

// Remember that the information (username/email) you send as the 'user_identifier'
// to OneLogin must be used each time you make the /smart-mfa request.
const signupRoute = async (req: Request, res: Response) => {
  let {user_identifier, phone, context} = req.body;
  let missingFields: Array<string> = [];

  if( !user_identifier ) missingFields.push("user_identifier");
  if( !phone ) missingFields.push("phone");
  if( !context ) missingFields.push("context");

  if( missingFields.length > 0 ) {
    return res.status(400).json({
      error: { message: `required fields ${missingFields.join(" ")} are missing` }
    });
  }
  try{
    // when establishing the user for the first time, this will create a user in
    // OneLogin, use your Twilio credentials to send a text message, and give us a state_token
    let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
    let headers = {
      'Authorization': `Bearer ${req.olBearerToken}`,
      'Content-Type': 'application/json'
    };

    let { status, data } = await axios.post( url, req.body, { headers } );
    // When the user signs up they should get a text with a one time password (OTP)
    // your calling app will collect this OTP from the user and send it with the
    // state_token back to the /otp endpoint.

    // you might attempt to persist the user here or cache the user and state token and await verification.

    // the data object contains a mfa node that contains the state_token and a flag
    // indicating if a SMS was sent. You can either simply return data.mfa in the response,
    // or combine these fields with other elements for your response.
    // For simplicity, we'll just return the status from OneLogin.
    res.status(status).json(data.mfa);

  } catch(err) {
    console.log("Error", err.message);
    res.status(500).send(err.message);
  }
}

// This is called when a user attempts to log in with their username.
const loginRoute = async (req: Request, res: Response) => {
  try{
    // you would check the username and password to authenticate the user here, for example:
    // let user = UserRepository.find(req.user.user_identifier);
    // if(!user) {
    //   return res.status(401).json({
    //     error: {message: "invalid user_identifier"}
    //   });
    // }
    // if(!user.isAuthenticated(req.user.password)) {
    //   return res.status(401).json({
    //     error: {message: "invalid password"}
    //   });
    // }

    // this request will leverage the A.I. platform to determine if the user's
    // behavior (location, time of day, etc...) warrants a secondary SMS factor
    let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/`;
    let headers = {
      'Authorization': `Bearer ${req.olBearerToken}`,
      'Content-Type': 'application/json'
    };

    let { status, data } = await axios.post( url, req.body, { headers } );

    // if the login attempt is deemed risky (e.g. the password was compromised)
    // we'll send a text to the user and return a state token to your calling app

    // the data object contains a mfa node that contains the state_token and a flag
    // indicating if a SMS was sent. You can either simply return data.mfa in the response,
    // or combine these fields with other elements for your response.
    // This will tell the calling app that a OTP prompt is needed and to which
    // state_token it should be associated.
    // For simplicity, we'll just return the status from OneLogin.
    res.status(status).json(data.mfa);

  } catch(err) {
    console.log("Error", err.message);
    res.status(500).send(err.message);
  }
}

// This is where you'd send the otp collected from the user in the calling app and
// the state_token to validate the second factor
const otpRoute = async (req: Request, res: Response) => {
  let {otp_token, state_token} = req.body;
  let missingFields: Array<string> = [];

  if( !otp_token ) missingFields.push("otp_token");
  if( !state_token ) missingFields.push("state_token");

  if( missingFields.length > 0 ) {
    return res.status(400).json({
      error: { message: `required fields ${missingFields.join(" ")} are missing` }
    });
  }

  // handle and verify the OTP collected from the user in the calling application
  try{
    let url = `${process.env.ONELOGIN_API_URL}/api/2/smart-mfa/verify`;
    let headers = {
      'Authorization': `Bearer ${req.olBearerToken}`,
      'Content-Type': 'application/json'
    };

    let { status, data } = await axios.post( url, req.body, { headers } );

    // If you cached a new user awaiting OTP verification, and the OTP is verified
    // you might remove the user from cache to persistent storage here.

    res.status(status).json(data);

  } catch(err) {
    console.log("Error", err.message);
    res.status(500).send(err.message);
  }
}

export default AuthRoutes;
