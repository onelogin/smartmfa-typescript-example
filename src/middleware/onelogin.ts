import express, {Request, Response, NextFunction} from 'express'
import axios from 'axios'

/*
AuthOneLogin - express router middleware that authenticates the app with OneLogin
using a client id and secret for OneLogin and attaching the returned access_token
to the request on the 'olBearerToken' field.

This middleware is typically used when a route handler needs to request something
from the OneLogin API using a protected route.

@param req: Request - the express request object from the router service
@param res: Response - the express response object from the router service
@param next: NextFunction - the express middleware next handler
*/

const AuthOneLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let clientCredentials = `${process.env.ONELOGIN_CLIENT_ID}:${process.env.ONELOGIN_CLIENT_SECRET}`
  let encodedCredentials = Buffer.from(clientCredentials).toString('base64')

  let url = `${process.env.ONELOGIN_API_URL}/auth/oauth2/v2/token`
  let requestBody = {"grant_type": "client_credentials"}
  let headers = {
    "Content-Type": `application/json`,
    "Authorization": `Basic ${encodedCredentials}`
  }
  try {
    let bearerResponse = await axios.post(url, requestBody, {headers})
    req.olBearerToken = bearerResponse.data.access_token
  } catch(err) {
    console.log("Unable to authenticate request to OneLogin", err.message)
  } finally {
    next()
  }
}

export default AuthOneLogin
