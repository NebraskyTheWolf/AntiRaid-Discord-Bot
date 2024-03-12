import * as dotenv from "dotenv";

dotenv.config()


global.__rootdir__ = __dirname || process.cwd();

declare global {
  var __rootdir__: string;
}


import 'module-alias/register';
import { Client, Intents } from "discord.js";
import mongoose from "mongoose";

import CommandManager from "./components/commands/CommandManager";
import ButtonManager from "./components/buttons/ButtonManager";
import EventManager from "./events/EventManager";
import discordModals from "discord-modals";

import Logger from "@fluffici.ts/logger";
import InitChecker from '@fluffici.ts/utils/InitChecker';
import {SlashCommandBuilder} from "@discordjs/builders";

export default class Fluffici extends Client {
    public static instance: Fluffici

    public database: mongoose.Mongoose

    public readonly logger: Logger
    public readonly checker: InitChecker

    public readonly REGISTRY: SlashCommandBuilder
    public manager: CommandManager
    public eventManager: EventManager
    public buttonManager: ButtonManager
    public loaded: boolean = false

    public readonly version: string = process.env.VERSION || "Unreferenced version."
    public readonly revision: string = process.env.REVISION || "Unreferenced revision code."

    public constructor () {
      super({
        partials: ["MESSAGE", "USER", "REACTION"],
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.MESSAGE_CONTENT,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          Intents.FLAGS.GUILD_MESSAGE_TYPING,
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_PRESENCES
        ]
      })
      Fluffici.instance = this
      this.logger = new Logger("Fluffici")
      this.checker = new InitChecker()

      this.setupErrorHandling()
      this.doInitialCheckOrStart()
    }

    private setupErrorHandling (): void {
      process.on('uncaughtException', function (error) {
        Fluffici.instance.logger.error("uncaughtException: ")
        Fluffici.instance.logger.error("Stacktrace: " + error.stack)
        Fluffici.instance.logger.error("\n");
      });

      process.on('unhandledRejection', function (error, object) {
        Fluffici.instance.logger.error("unhandledRejection: ")
        Fluffici.instance.logger.error("Stacktrace: " + error)
        Fluffici.instance.logger.error("Object: " + JSON.stringify(object))
        Fluffici.instance.logger.error("\n")
      });
    }

    private doInitialCheckOrStart (): void {
      if (this.checker.init())
        this.logger.error('  -> Process aborted.')
      else
        this.start()
    }

    private async start () {
      this.logSystemInfo();
      this.connectToDBAndLoad();
    }

    private logSystemInfo (): void {
      this.logger.info("Loading system...")
      this.logger.info(`Version: ${this.version}`)
      this.logger.info(`Revision: ${this.revision}`)
    }

    private connectToDBAndLoad (): void {
      this.logger.info("Connecting to MongoDB")
      mongoose.connect(process.env.MONGODB, {}).then(db => {
        this.database = db;
        this.logger.info("Connected to MongoDB.");
        this.load();
      }).catch(err => { this.logger.warn("Failed to contact the database.") });
    }

    private load() {
      this.logger.info("Loading system...")

      this.manager = new CommandManager()
      this.manager.registerCommands()

      this.eventManager = new EventManager()
      this.eventManager.registerEvents()

      this.buttonManager = new ButtonManager()
      this.buttonManager.registerButtons()

      this.login(process.env.TOKEN)
    }

    public reload () {
      this.logger.info("Reloading components...")
      this.manager.reload()
      this.buttonManager.reload()
    }

    public static getInstance (): Fluffici {
      return this.instance
    }
}

export const fluffici: Fluffici = new Fluffici()
