import express, { Request, Response } from 'express'
import { Client } from '@onelogin/sdk'

import { Database } from "../database/db_interfaces"
import { User } from "../models/user"

const AuthRoutes = (routerOptions: RouterOptions) => {
  const router = express.Router()
  const authRouter = new AuthRouter(routerOptions)

  router.post('/signup', authRouter.signupRoute)
  router.post('/login', authRouter.loginRoute)
  router.post('/otp', authRouter.otpRoute)

  return router
}

interface RouterOptions {
  dataStore: Database<User>;
  external: { onelogin?: Client }
}

class AuthRouter {
  userDB: Database<User>
  oneLoginClient: Client

  constructor(routerOptions: RouterOptions) {
    this.userDB = routerOptions.dataStore
    this.oneLoginClient = routerOptions.external.onelogin
  }

  // Sign up will establish the user's information in our database and register
  // the MFA device with OneLogin by sending a OTP that a user will verify
  signupRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields( req.body, ["email", "phone", "password"] )
    if( missingFields ) return res.status(400).json({ error: missingFields })

    try {
      let existingUser = this.userDB.Read(req.body.email)
      if( existingUser ) {
        return res.status(400).json({
          error: `User with id ${req.body.email} exists!`
        })
      }

      let { email: user_identifier, phone, password } = req.body
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      }

      let { data, error } = await this.oneLoginClient.smartMFA.CheckMFARequired({
        user_identifier, phone, context
      })

      if( error ) return res.status(error.httpStatusCode).json(error.data)

      // Persist the user
      this.userDB.Upsert({
        phone,
        password,
        id: user_identifier,
        email: user_identifier
      })

      // Let client know if a OTP was sent.
      // data.mfa looks like {otp_sent: true, state_token: 12345}
      console.log(`Completed Risk Assessment for ${user_identifier}`)
      return res.status(200).json(data.mfa)

    } catch( err ) {
      console.log("An unknown error occurred", err)
      return res.status(500).send(err.message)
    }
  }

  // This is called when a user attempts to log in with their username.
  loginRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields( req.body, ["email", "password"] )
    if( missingFields ) return res.status(400).json({ error: missingFields })

    try {
      // Look for existing user and verify the password
      let user = this.userDB.Read(req.body.email)
      if( !user ) {
        return res.status(400).json({
          error: `User with id ${req.body.email} not found!`
        })
      }

      // DO NOT store plaintext passwords or compare them like this.
      // FOR DEMO PURPOSES ONLY!
      if( user.password != req.body.password ) {
        return res.status(400).json({ error: `Wrong password` })
      }

      let { email: user_identifier, phone } = user
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      }

      let { data, error } = await this.oneLoginClient.smartMFA.CheckMFARequired({
        user_identifier, phone, context
      })

      if( error ) return res.status(error.httpStatusCode).json(error.data)
      // Let client know if OTP was sent.
      // data.mfa looks like {otp_sent: true, state_token: 12345}
      // or {otp_sent: false}
      console.log(`Completed Risk Assessment for ${user_identifier}`)
      return res.status(200).json(data.mfa)

    } catch( err ) {
      console.log("An unknown error occurred", err)
      return res.status(500).send(err.message)
    }
  }

  // This is where you'd send the otp collected from the user in the calling app
  // and the state_token to validate the second factor
  otpRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields( req.body, ["otp_token", "state_token"] )
    if( missingFields ) return res.status(400).json({ error: missingFields })

    try {
      let data = await this.oneLoginClient.smartMFA.ValidateOTP( { ...req.body } )
      console.log("OTP Validation Done!")
      return res.status(200).json(data)

    } catch( err ) {
      console.log("An unknown error occurred", err)
      return res.status(500).send(err.message)
    }
  }

  // Scans the request object for the required fields given.
  // Returns an error if a field is missing
  requiredFields = (req: object, fields: string[]): object => {
    let missingFields: Array<string> = []

    fields.forEach(field => {
      if( !req.hasOwnProperty( field ) ) missingFields.push( field )
    })

    if( missingFields.length > 0 ) {
      return { message: `required fields ${missingFields.join(" ")} are missing` }
    }
  }
}

export default AuthRoutes
