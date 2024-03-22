import BaseMiddleware from "../BaseMiddleware";
import { Request, Response } from "express";
import {isNull} from "@fluffici.ts/types";

export default class Authentication extends BaseMiddleware {

  public constructor() {
    super("Authentication", "Authentication middleware.")
  }
  public async handle(request: Request, response: Response, next) {
    const authHeader = request.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return response.sendStatus(401)

    if (isNull(process.env.ACCESS_TOKEN_SECRET)) {
      return this.sendAuthError(response, "Authentication is not allowed.")
    }

    if (process.env.ACCESS_TOKEN_SECRET === token) {
      next()
    } else {
      return this.sendAuthError(response, "Your authentication token is invalid.")
    }
  }

  private sendAuthError(response: Response, message: string) {
    return response.json({
      status: false,
      error: "INVALID_TOKEN",
      message: message
    }).end()
  }
}
