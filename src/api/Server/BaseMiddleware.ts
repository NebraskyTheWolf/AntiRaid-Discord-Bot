import { NextFunction } from "express-serve-static-core";
import Base from "../../abstracts/Base";
import {Request, Response} from "express";

export default abstract class BaseMiddleware extends Base {
  protected constructor(name: string, description?: string) {
    super(name, description, "SERVER")
  }

  public abstract handle(request: Request, response: Response, next: NextFunction): void
}
