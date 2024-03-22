import Base from "../../abstracts/Base";
import { Router, Response } from "express";
import express from "express";

import CacheManager from "../cache/CacheManager";
import Authentication from "./middlewares/Authentication";

export declare enum ErrorType {
    SUCCESS_CALLBACK = 200,
    MISSING_ARGUMENTS = 400,
    MISSING_SIGNATURE = 401,
    INSUFICIENT_PERMISSION = 402,
    FORBIDDEN = 403,
    RATELIMITED = 429,
    INTERNAL = 500
}

export default abstract class RouteBase extends Base {
    protected readonly routerInstance: Router
    protected readonly cacheManager: CacheManager
    protected readonly authentication: Authentication
    public readonly isRouteProtected: boolean;
    public readonly routePrefix: string;

    public constructor() {
        super("routes", "", "SERVER")
        this.routerInstance = router;
        this.cacheManager = new CacheManager("api")
        this.authentication = new Authentication()
        this.selfRegister();
    }

    public abstract selfRegister(): void;

    protected handleError(res: Response, errorType: ErrorType): void {
        const errorResponsePayload = this.prepareErrorResponsePayload(errorType)
        res.status(errorType.valueOf()).json(errorResponsePayload).end()
    }

    protected prepareErrorResponsePayload(errorType: ErrorType) {
        return {
            status: false,
            error: errorType.valueOf()
        }
    }

    protected sendSuccessResponse(res: any, responseData: any) {
        const successResponsePayload = this.prepareSuccessResponsePayload(responseData)
        return res.status(200).json(successResponsePayload).end()
    }

    protected prepareSuccessResponsePayload(responseData: any) {
        return {
            status: true,
            data: responseData,
        }
    }

    public getRouter(): Router {
        return this.routerInstance;
    }
}

export const router = express.Router()
