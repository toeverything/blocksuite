import { assertExists } from '@blocksuite/global/utils';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';
import type { BlockElement, EditorHost } from '@blocksuite/lit';

import { BLOCK_ID_ATTR } from '../../consts.js';
import type { AffineTextAttributes } from '../../inline/presets/affine-inline-specs.js';
import {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';

export function isFormatSupported(host: EditorHost) {
  let result = false;

  host.std.command
    .chain()
    .withHost()
    .try(chain => [
      // text selection, corresponding to `formatText` command
      chain
        .getTextSelection()
        .getSelectedBlocks({
          types: ['text'],
          filter: el =>
            FORMAT_TEXT_SUPPORT_FLAVOURS.includes(
              el.model.flavour as BlockSuite.Flavour
            ),
        })
        .inline((ctx, next) => {
          const { currentTextSelection, selectedBlocks } = ctx;
          assertExists(currentTextSelection);
          assertExists(selectedBlocks);

          if (currentTextSelection.isCollapsed()) return;

          const selectedInlineEditors = selectedBlocks.flatMap(el => {
            const inlineRoot = el.querySelector<
              InlineRootElement<AffineTextAttributes>
            >(`[${INLINE_ROOT_ATTR}]`);
            if (inlineRoot && inlineRoot.inlineEditor.getInlineRange()) {
              return inlineRoot.inlineEditor;
            }
            return [];
          });

          result = selectedInlineEditors.length > 0;
          next();
        }),
      // block selection, corresponding to `formatBlock` command
      chain
        .getBlockSelections()
        .getSelectedBlocks({
          types: ['block'],
          filter: el =>
            FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(
              el.model.flavour as BlockSuite.Flavour
            ),
        })
        .inline((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const selectedInlineEditors = selectedBlocks.flatMap(el => {
            const inlineRoot = el.querySelector<
              InlineRootElement<AffineTextAttributes>
            >(`[${INLINE_ROOT_ATTR}]`);
            if (inlineRoot) {
              return inlineRoot.inlineEditor;
            }
            return [];
          });

          result = selectedInlineEditors.length > 0;
          next();
        }),
      // native selection, corresponding to `formatNative` command
      chain.inline(() => {
        const selectedInlineEditors = Array.from<InlineRootElement>(
          host.querySelectorAll(`[${INLINE_ROOT_ATTR}]`)
        )
          .filter(el => {
            const selection = document.getSelection();
            if (!selection || selection.rangeCount === 0) return false;
            const range = selection.getRangeAt(0);

            return range.intersectsNode(el);
          })
          .filter(el => {
            const blockElement = el.closest<BlockElement>(`[${BLOCK_ID_ATTR}]`);
            if (blockElement) {
              return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(
                blockElement.model.flavour as BlockSuite.Flavour
              );
            }
            return false;
          })
          .map(el => el.inlineEditor);

        result = selectedInlineEditors.length > 0;
      }),
    ])
    .run();

  return result;
}
