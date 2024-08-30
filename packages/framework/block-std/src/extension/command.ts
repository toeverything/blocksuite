import type { BlockCommands } from '../spec/index.js';
import type { ExtensionType } from './extension.js';

import { CommandIdentifier } from '../identifier.js';

export function CommandExtension(commands: BlockCommands): ExtensionType {
  return {
    setup: di => {
      Object.entries(commands).forEach(([name, command]) => {
        di.addImpl(CommandIdentifier(name), () => command);
      });
    },
  };
}
