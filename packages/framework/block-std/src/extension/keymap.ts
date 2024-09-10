import type { EventOptions, UIEventHandler } from '../event/index.js';
import type { ExtensionType } from './extension.js';

import { KeymapIdentifier } from '../identifier.js';

let id = 1;

/**
 * Create a keymap extension.
 *
 * @param keymap
 * Keymap of the extension.
 *
 * @param options
 * Options for the keymap, you can restrict the keymap to a specific flavour or block.
 *
 * @example
 * ```ts
 * import { KeymapExtension } from '@blocksuite/block-std';
 *
 * const MyKeymapExtension = KeymapExtension({
 *   'mod-a': SelectAll
 * });
 * ```
 */
export function KeymapExtension(
  keymap: Record<string, UIEventHandler>,
  options?: EventOptions
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(KeymapIdentifier(`${keymap}-${id++}`), () => ({
        keymap,
        options,
      }));
    },
  };
}
