import fs from 'fs';
import path from 'path';

export default class LanguageManager {
  private language: string;
  private translationMap: Record<string, string> = {};

  /**
   * Sets the active language and loads the corresponding language file.
   *
   * @param {string} language - The language to set.
   */
  public setLanguage(language: string): void {
    this.language = language;
    this.translationMap = JSON.parse(this.getLanguageFile());
  }

  /**
   * Gets the current active language.
   *
   * @return {string} The active language.
   */
  public getLanguage(): string {
    return this.language;
  }

  /**
   * Loads and returns the contents of the active language file.
   *
   * @return {string} The file contents of the current active language file.
   * @throws {Error} If the language file does not exist.
   */
  public getLanguageFile(): string {
    const languageFilePath = path.join(__dirname, '..', '..', 'languages', `${this.language}.json`);

    if (fs.existsSync(languageFilePath)) {
      return fs.readFileSync(languageFilePath, 'utf8');
    }

    throw new Error('Language file does not exist.');
  }

  /**
   * Translates a key into the active language.
   *
   * @param {string} key - The key to translate.
   * @param {Record<string, string>} args - The arguments to replace in the translated text.
   * @param _default - The default message in case the translation does not exist.
   * @return {string} The translated string or key if translation does not exist.
   */
  public translate(key: string, args: Record<string, string> = {}): string {
    let translation = this.translationMap[key] || key;

    // Replace placeholders with arguments
    for (const placeholder in args) {
      const regex = new RegExp(':' + placeholder, 'g');
      translation = translation.replace(regex, args[placeholder]);
    }

    return translation;
  }
}
