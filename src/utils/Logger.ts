import fs from "fs"
import moment from "moment";

export default class Logger {
    private readonly prefix: string;
    private readonly date: Date;

    public constructor(prefix: string) {
        this.prefix = prefix;
        this.date = new Date();
        fs.writeFile(`logs/${this.date}.log`, "------------ STARTING LOGGING SESSION ------------\n", (err) => { });
    }

    public info(message: string) {
        this.log("info", message);
    }

    public warn(message: string) {
        this.log("warn", message);
    }

    public error(message: string) {
        this.log("error", message);
    }

    private log(type: string, message: string) {
        const prefix = `${moment(Date.now())} : ${this.prefix} . [${type}] - ${message}`;
        fs.appendFileSync(`logs/${this.date}.log`, `${prefix}\n`);
        console.log(prefix);
    }
}
