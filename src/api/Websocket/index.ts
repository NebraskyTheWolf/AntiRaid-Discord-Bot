import Mesa, { Message } from "@cryb/mesa"
import http from "http"

declare type Data = {
    [key in string]?: any;
};

export default class Websocket extends Mesa {

    public constructor(server: http.Server) {
        super({
            port: 8443,
            server: server,
            heartbeat: {
                enabled: true,
                interval: 10000
            },
            redis: process.env['REDIS_URL'],
            authentication: {
                required: true,
                storeConnectedUsers: true,
                timeout: 10000
            }
        });

        this.on("connection", client => {})
    }

    public sendPacket(action: string, data: Data, recipient: string): void {
        this.send(new Message(0, data, action), [recipient])
    }
}
