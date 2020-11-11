import express, {Request, Response} from 'express'
import { Client } from 'onelogin-node-sdk'
import axios from 'axios'

import AuthOneLogin from '../middleware/onelogin'

import {Database} from "../database/db_interfaces"
import {User} from "../models/user"

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
  external: {
    onelogin?: Client
  }
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
    let missingFields = this.requiredFields(
      req.body,
      ["user_identifier", "phone", "password"]
    )

    if(missingFields) {
      return res.status(400).json({error: missingFields})
    }

    try {
      let existingUser = this.userDB.Read(req.body.user_identifier)
      if(existingUser) {
        return res.status(400).json({
          error: `User with id ${req.body.user_identifier} exists!`
        })
      }

      let {user_identifier, phone, password} = req.body
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      }

      let data = await this.oneLoginClient.smartMFA.CheckMFARequired({
        user_identifier, phone, context
      })

      // Persist the user in our database
      this.userDB.Upsert({
        phone,
        password,
        id: user_identifier,
        userIdentifier: user_identifier
      })

      // Let client know if a OTP was sent.
      // data.mfa looks like {otp_sent: true, state_token: 12345}
      console.log(`Completed Risk Assessment for ${user_identifier}`)
      res.status(200).json(data.mfa)

    } catch(err) {
      if(err.response.status < 500){
        console.log("Bad Request to OneLogin", err.response.data)
        res.status(500).send(err.response.data)
      } else {
        console.log("Unable to Connect to OneLogin", err.response.data)
        res.status(500).send(err.response.data)
      }
    }
  }

  // This is called when a user attempts to log in with their username.
  loginRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields(
      req.body, ["user_identifier", "password"]
    )

    if(missingFields) {
      return res.status(400).json({error: missingFields})
    }

    try {
      // Look for existing user and verify the password
      let user = this.userDB.Read(req.body.user_identifier)
      if(!user) {
        return res.status(400).json({
          error: `User with id ${req.body.user_identifier} not found!`
        })
      }

      // DO NOT store plaintext passwords or compare them like this.
      // FOR DEMO PURPOSES ONLY!
      if(user.password != req.body.password) {
        return res.status(400).json({error: `Wrong password`})
      }

      let {userIdentifier: user_identifier, phone} = user
      let context = {
        user_agent: req.headers["user-agent"],
        ip: req.connection.remoteAddress
      }

      let data = await this.oneLoginClient.smartMFA.CheckMFARequired({
        user_identifier, phone, context
      })

      // Let client know if OTP was sent.
      // data.mfa looks like {otp_sent: true, state_token: 12345}
      // or {otp_sent: false}
      console.log(`Completed Risk Assessment for ${user_identifier}`)
      res.status(200).json(data.mfa)

    } catch(err) {
      if(err.response.status < 500){
        console.log("Bad Request to OneLogin", err.response.data)
        res.status(err.response.status).send(err.response.data)
      } else {
        console.log("Unable to Connect to OneLogin", err.response.data)
        res.status(500).send(err.response.data)
      }
    }
  }

  // This is where you'd send the otp collected from the user in the calling app
  // and the state_token to validate the second factor
  otpRoute = async (req: Request, res: Response) => {
    let missingFields = this.requiredFields(
      req.body, ["otp_token", "state_token"]
    )

    if(missingFields) {
      return res.status(400).json({error: missingFields})
    }

    try {
      let data = await this.oneLoginClient.smartMFA.ValidateOTP({ ...req.body })

      console.log("OTP Validation Done!")
      res.status(200).json(data)

    } catch(err) {
      if(err.response.status < 500){
        console.log("OneLogin unable to validate OTP", err.response.data)
        res.status(err.response.status).send(err.response.data)
      } else {
        console.log("Unable to Connect to OneLogin", err.response.data)
        res.status(500).send(err.response.data)
      }
    }
  }

  // Scans the request object for the required fields given.
  // Returns an error if a field is missing
  requiredFields = (req: object, fields: string[]): object => {
    let missingFields: Array<string> = []
    fields.forEach(field => {
      if(!req.hasOwnProperty(field)) {
        missingFields.push(field)
      }
    })
    if(missingFields.length > 0) {
      return {message: `required fields ${missingFields.join(" ")} are missing`}
    }
  }
}

export default AuthRoutes
