import ora from "ora"
import { v4 } from "uuid"

export default abstract class BaseTest {
  private readonly name: string
  private readonly spinner: ora.Ora
  private readonly instanceId: string
  private timer: number = 180
  protected isRunning: boolean = false;

  protected constructor(name: string) {
    this.name = name;

    this.spinner = ora("Initializing " + this.name + ".").start()
    this.spinner.spinner = "clock"
    this.spinner.color = "red"

    this.instanceId = v4()

    process.on('uncaughtException', () => { })
    process.on('unhandledRejection', () => { })

    this.updateTheme()
    this.handle()
    const timeout = setInterval(() => {
      if (this.isRunning)
          return;
      this.timer = this.timer - 1
      if (this.timer <= 0) {
        //process.send('base:' + this.instanceId + ':' + this.name + '/abort')
        this.spinner.fail(`${this.name} test timed out.`)
        clearInterval(timeout)
        process.exit(10016)
      }
    })
  }

  protected abstract handle(): void

  protected updateText(text: string): void {
    this.spinner.text = text
  }

  protected updateTheme(): void {
    this.spinner.spinner = "dots"
    this.spinner.color = "blue"
  }

  protected updatePrefix(prefix: string): void {
    this.spinner.prefixText = prefix
  }

  public getName(): string {
    return this.name
  }

  public getInstanceId(): string {
    return this.instanceId
  }
}
