import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  INLINE_ROOT_ATTR,
  type InlineEditor,
  type InlineRange,
  type InlineRootElement,
} from '@blocksuite/inline';
import type { BlockElement } from '@blocksuite/lit';

import {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from '../../_common/configs/text-format/consts.js';
import { BLOCK_ID_ATTR } from '../../_common/consts.js';
import type {
  AffineInlineEditor,
  AffineTextAttributes,
} from '../../_common/inline/presets/affine-inline-specs.js';

function isActive(std: BlockSuite.Std, key: string) {
  const [result, ctx] = std.command.pipe().getTextStyle().run();
  if (!result) return false;
  return key in ctx.textStyle;
}

function handleCommonStyle(
  std: BlockSuite.Std,
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
) {
  const active = isActive(std, key);
  const payload: {
    styles: AffineTextAttributes;
    mode?: 'replace' | 'merge';
  } = {
    styles: {
      [key]: active ? null : true,
    },
  };
  return std.command
    .pipe()
    .withHost()
    .try(chain => [
      chain.getTextSelection().formatText(payload),
      chain.getBlockSelections().formatBlock(payload),
      chain.formatNative(payload),
    ])
    .run();
}

export function generateTextStyleCommand(
  key: Extract<
    keyof AffineTextAttributes,
    'bold' | 'italic' | 'underline' | 'strike' | 'code'
  >
): Command {
  return (ctx, next) => {
    const [result] = handleCommonStyle(ctx.std, key);

    if (result) {
      return next();
    }

    return false;
  };
}

function getCombinedFormatFromInlineEditors(
  inlineEditors: [AffineInlineEditor, InlineRange | null][]
): AffineTextAttributes {
  const formatArr: AffineTextAttributes[] = [];
  inlineEditors.forEach(([inlineEditor, inlineRange]) => {
    if (!inlineRange) return;

    const format = inlineEditor.getFormat(inlineRange);
    formatArr.push(format);
  });

  if (formatArr.length === 0) return {};

  // format will be active only when all inline editors have the same format.
  return formatArr.reduce((acc, cur) => {
    const newFormat: AffineTextAttributes = {};
    for (const key in acc) {
      const typedKey = key as keyof AffineTextAttributes;
      if (acc[typedKey] === cur[typedKey]) {
        // This cast is secure because we have checked that the value of the key is the same.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newFormat[typedKey] = acc[typedKey] as any;
      }
    }
    return newFormat;
  });
}

function getSelectedTextStyle(
  blocks: BlockElement[],
  filter: (
    inlineRoot: InlineRootElement<AffineTextAttributes>
  ) => InlineEditor<AffineTextAttributes> | [],
  mapper: (
    inlineEditor: InlineEditor<AffineTextAttributes>
  ) => [AffineInlineEditor, InlineRange | null]
) {
  const temp = blocks
    .flatMap(el => {
      const inlineRoot = el.querySelector<
        InlineRootElement<AffineTextAttributes>
      >(`[${INLINE_ROOT_ATTR}]`);

      if (inlineRoot) {
        return filter(inlineRoot);
      }
      return [];
    })
    .map(mapper);

  return getCombinedFormatFromInlineEditors(temp);
}

export function getCombinedTextStyle(std: BlockSuite.Std) {
  return std.command
    .pipe()
    .withHost()
    .try<'textStyle'>(chain => [
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
        .inline<'textStyle'>((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const textStyle = getSelectedTextStyle(
            selectedBlocks,
            inlineRoot => {
              const inlineRange = inlineRoot.inlineEditor.getInlineRange();
              if (!inlineRange || inlineRange.length === 0) return [];
              return inlineRoot.inlineEditor;
            },
            inlineEditor => [inlineEditor, inlineEditor.getInlineRange()]
          );

          next({ textStyle });
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
        .inline<'textStyle'>((ctx, next) => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);

          const textStyle = getSelectedTextStyle(
            selectedBlocks,
            inlineRoot => {
              if (inlineRoot.inlineEditor.yTextLength > 0) {
                return inlineRoot.inlineEditor;
              }
              return [];
            },
            inlineEditor => [
              inlineEditor,
              { index: 0, length: inlineEditor.yTextLength },
            ]
          );

          next({ textStyle });
        }),
      // native selection, corresponding to `formatNative` command
      chain.inline<'textStyle'>((ctx, next) => {
        const selectedInlineEditors = Array.from<InlineRootElement>(
          ctx.std.host.querySelectorAll(`[${INLINE_ROOT_ATTR}]`)
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

        const textStyle = getCombinedFormatFromInlineEditors(
          selectedInlineEditors.map(e => [e, e.getInlineRange()])
        );

        return next({ textStyle });
      }),
    ])
    .run();
}
