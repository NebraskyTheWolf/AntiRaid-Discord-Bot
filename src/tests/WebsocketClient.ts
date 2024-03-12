import BaseTest from './BaseTest'
import { Client } from '@cryb/mesa'

const socket = new Client(process.env['WEBSOCKET_URL'] || "wss://gateway.fluffici.eu")

export default class WebsocketClient extends BaseTest {

  public counter = 0
  public cycleBeforeFailure = 5
  public reconnect = 5
  public messageCount = 0

  public connectId: NodeJS.Timeout
  public disconnectId: NodeJS.Timeout


  public constructor() {
    super("websocket_client")
  }

  protected async handle() {
    this.isRunning = true;
    socket.on("connected", () => {
      this.updateText("Connection established.")
      if (this.disconnectId)
        clearInterval(this.disconnectId)
      this.connectId = setInterval(() => {
        this.counter = this.counter + 1;
        this.updateText("Listening since " + this.counter + " seconds")
        if (this.messageCount >= 50) {
          this.updatePrefix("HANDSHAKE")
          process.exit(0)
        } else if (this.counter >= 50 && this.messageCount < 50) {
          this.updateText("The debug operation has failed. Please check the server-side and try again.")
          process.exit(10016)
        }
      }, 1000)
    })

    socket.on('message', (message) => {
        this.messageCount = this.messageCount + 1;
        this.updatePrefix(message.type)
    });

    socket.on('error', (err) => {
      this.updateText("Error occurred : " + err.message)
    })

    socket.on('disconnected', () => {
      clearInterval(this.connectId)
      this.disconnectId = setInterval(() => {
        this.reconnect = this.reconnect - 1;
        this.updateText("Disconnected : trying to reconnect in " + this.reconnect + "s")
        if (this.reconnect === 0) {
          this.reconnect = 20
          this.cycleBeforeFailure - 1

          if (this.cycleBeforeFailure  <= 0) {
            this.updateText("Connection lost. Test failed.")
            process.exit(1)
          }

          clearInterval( this.disconnectId)
          socket.connect()
        }
      }, 1000)
    })
  }
}

export const poc: WebsocketClient = new WebsocketClient()
