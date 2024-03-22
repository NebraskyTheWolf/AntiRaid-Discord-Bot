import Tuple from "@fluffici.ts/utils/Tuple";
import Fluffici from "@fluffici.ts";

import express, {RequestHandler} from "express";
import http from "http";

import AbstractRoutes from "./Server/AbstractRoutes"
import * as parser from "body-parser"
import ApiRoutes from "./Server/routes/api-routes";
import UserRoutes from "./Server/routes/user-routes";

const app = express();

export default class ServerManager {
    private routes: Tuple<AbstractRoutes>
    private server: http.Server

    public constructor() {
        this.routes = new Tuple<AbstractRoutes>()
        this.setExpressSettings();
        this.server = http.createServer(app);
    }

    private setExpressSettings(): void {
        app.set('trust proxy', 1); // trust first proxy
        app.use(this.getCORSHandler());
        app.use(parser.json());
        app.get('/', this.getRootRouteHandler());
    }

    private getCORSHandler(): RequestHandler {
        return function (req, res, next) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // @ts-ignore
            res.setHeader('Access-Control-Allow-Credentials', true);
            next();
        };
    }

    private getRootRouteHandler(): RequestHandler {
        return async (req, res) => {
            res.status(200).json({
                appName: 'FurRaidDB',
                appVersion: Fluffici.instance.version,
                appRevision: Fluffici.instance.revision,
                appAuthors: [
                    "Asherro <asherro@fluffici.eu>",
                    "Vakea <vakea@fluffici.eu>"
                ],
                appUptime: Fluffici.instance.uptime || "Uptime is not referenced",
            });
        };
    }

    public initServers(): void {
        this.routes.getAll().forEach((route) => {
          app.use('/api', route.getRouter());
        });

        this.server.listen(4444);
    }

    public registerServers(): void {
        this.routes.add(new ApiRoutes());
        this.routes.add(new UserRoutes());
    }
}
