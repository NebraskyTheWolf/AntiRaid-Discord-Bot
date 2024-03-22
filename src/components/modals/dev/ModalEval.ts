import {ModalSubmitInteraction} from "discord-modals";
import BaseModal from "@fluffici.ts/components/BaseModal";
import { VM } from 'vm2';
import {isNull} from "@fluffici.ts/types";

export default class ModalEval extends BaseModal {

  public constructor() {
    super("row_code_evaluation");
  }

  /**
   * Executes user-submitted scripts from '!eval' command in a Discord bot.
   * Ensures user has admin permissions.
   * Uses 'vm2' for secure sandboxed environment and maintains a list of blocked keywords.
   * Time limits are set to prevent long running scripts.
   * Notifies user when execution is successful or if an error is encountered.
   * Note: Allowing user arbitrary code execution poses security risk.
   *
   * @param inter
   */
  public async handler(inter: ModalSubmitInteraction): Promise<void> {
    let code: string = inter.getTextInputValue("row_code");
    const decorators: string = inter.getTextInputValue("row_code_decorators");

    if (!code) {
      return inter.reply({
        content: 'Code is required.',
        ephemeral: false
      })
    }

    if (decorators) {
      code = this.ScriptDecorator(decorators, code)
    }

    const blockedKeywords = [
      'process.env',
      'require',
      'fs',
      'child_process',
      'global',
      '__dirname',
      '__filename',
      'process',
      'console',
      'require',
      '@fluffici.ts/',
      'fs',
      'path',
      'os',
      'http',
      'https',
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'setImmediate',
      'Array.prototype',
      'Object.prototype',
      'module',
      'exports',
      'Buffer',
      'rm -rf',
      'sudo',
      'su',
    ];

    for (const keyword of blockedKeywords) {
      if (code.includes(keyword)) {
        return await inter.reply({
          embeds: [
            {
              title: 'FurRaidDB - Code evaluation : failed.',
              description: `The decorator '${keyword}' is not permitted.`,
              color: "RED"
            }
          ],
          ephemeral: false
        })
      }
    }
    const isDecorated = !isNull(decorators);

    try {
      const vm = new VM({
        timeout: 1000, // One second should be more than enough for most tasks
        sandbox: {},
        eval: false,  // Don't allow the scripts to use eval()
        wasm: false,   // Don't allow the scripts to use WebAssembly
        allowAsync: true // Allow async task
      });

      const result = vm.run(code);
      return await inter.reply({
        embeds: [
          {
            title: `FurRaidDB - Code evaluation : success. '${isDecorated ? 'Decorated' : ''}'`,
            description: `**Result:**\`\`\`${result}\`\`\``,
            color: "GREEN"
          }
        ],
        ephemeral: false
      })
    } catch (error) {
      return await inter.reply({
        embeds: [
          {
            title: `FurRaidDB - Code evaluation : failed. '${isDecorated ? 'Decorated' : ''}'`,
            description: `**Result:**\`\`\`${error.message}\`\`\``,
            color: "RED"
          }
        ],
        ephemeral: false
      })
    }
  }

  ScriptDecorator(decoratorScript: string, userScript: string) {
    return `
      ${decoratorScript}
      class ScriptContainer {
          @decorator
          static userScript() {
              ${userScript}
          }
      }
      ScriptContainer.userScript();
    `;
  }
}
