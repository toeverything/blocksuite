import type { EventOptions, UIEventHandler } from '../event/index.js';
import type { BlockStdScope } from '../scope/index.js';
import type { ExtensionType } from './extension.js';

import { KeymapIdentifier } from '../identifier.js';

let id = 1;

/**
 * Create a keymap extension.
 *
 * @param keymapFactory
 * Create keymap of the extension.
 * It should return an object with `keymap` and `options`.
 *
 * `keymap` is a record of keymap.
 *
 * @param options
 * `options` is an optional object that restricts the event to be handled.
 *
 * @example
 * ```ts
 * import { KeymapExtension } from '@blocksuite/block-std';
 *
 * const MyKeymapExtension = KeymapExtension(std => {
 *   return {
 *     keymap: {
 *       'mod-a': SelectAll
 *     }
 *     options: {
 *       flavour: 'affine:paragraph'
 *     }
 *   }
 * });
 * ```
 */
export function KeymapExtension(
  keymapFactory: (std: BlockStdScope) => Record<string, UIEventHandler>,
  options?: EventOptions
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(KeymapIdentifier(`Keymap-${id++}`), {
        getter: keymapFactory,
        options,
      });
    },
  };
}
