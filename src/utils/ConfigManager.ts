import fs from 'fs';
import path from 'path';

export default class ConfigManager {
  private config: string;
  private configMap: Record<string, string> = {};

  public setConfig(config: string): void {
    this.config = config;
    this.configMap = JSON.parse(this.getConfigFile());
  }

  public getConfigFile(): string {
    const languageFilePath = path.join(__dirname, '..', '..', 'config', `${this.config}.json`);

    if (fs.existsSync(languageFilePath)) {
      return fs.readFileSync(languageFilePath, 'utf8');
    }

    throw new Error('Config file does not exist.');
  }

  public get(key: string, _default: any = null): any {
    return this.config[key] || _default;
  }
}
