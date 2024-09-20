import {
  BLOCK_ID_ATTR,
  type BlockComponent,
  type Chain,
  type Command,
  type CommandKeyToData,
  type InitCommandCtx,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  INLINE_ROOT_ATTR,
  type InlineEditor,
  type InlineRange,
  type InlineRootElement,
} from '@blocksuite/inline';
import { effect } from '@preact/signals-core';

import type { AffineTextAttributes } from '../extension/index.js';
import type { AffineInlineEditor } from '../inline/index.js';

import {
  FORMAT_BLOCK_SUPPORT_FLAVOURS,
  FORMAT_NATIVE_SUPPORT_FLAVOURS,
  FORMAT_TEXT_SUPPORT_FLAVOURS,
} from './consts.js';

function isActive(std: BlockSuite.Std, key: keyof AffineTextAttributes) {
  const [result] = std.command.chain().isTextStyleActive({ key }).run();
  return result;
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
    .chain()
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

function getSelectedInlineEditors(
  blocks: BlockComponent[],
  filter: (
    inlineRoot: InlineRootElement<AffineTextAttributes>
  ) => InlineEditor<AffineTextAttributes> | []
) {
  return blocks.flatMap(el => {
    const inlineRoot = el.querySelector<
      InlineRootElement<AffineTextAttributes>
    >(`[${INLINE_ROOT_ATTR}]`);

    if (inlineRoot) {
      return filter(inlineRoot);
    }
    return [];
  });
}

function handleCurrentSelection<
  InlineOut extends BlockSuite.CommandDataName = never,
>(
  chain: Chain<InitCommandCtx>,
  handler: (
    type: 'text' | 'block' | 'native',
    inlineEditors: InlineEditor<AffineTextAttributes>[]
  ) => CommandKeyToData<InlineOut> | boolean | void
) {
  return chain.try<InlineOut>(chain => [
    // text selection, corresponding to `formatText` command
    chain
      .getTextSelection()
      .getSelectedBlocks({
        types: ['text'],
        filter: el => FORMAT_TEXT_SUPPORT_FLAVOURS.includes(el.model.flavour),
      })
      .inline<InlineOut>((ctx, next) => {
        const { selectedBlocks, currentTextSelection } = ctx;
        assertExists(selectedBlocks);

        assertExists(currentTextSelection);
        if (currentTextSelection.isCollapsed()) return false;

        const selectedInlineEditors = getSelectedInlineEditors(
          selectedBlocks,
          inlineRoot => {
            const inlineRange = inlineRoot.inlineEditor.getInlineRange();
            if (!inlineRange) return [];
            return inlineRoot.inlineEditor;
          }
        );

        const result = handler('text', selectedInlineEditors);
        if (!result) return false;
        if (result === true) {
          return next();
        }
        return next(result);
      }),
    // block selection, corresponding to `formatBlock` command
    chain
      .getBlockSelections()
      .getSelectedBlocks({
        types: ['block'],
        filter: el => FORMAT_BLOCK_SUPPORT_FLAVOURS.includes(el.model.flavour),
      })
      .inline<InlineOut>((ctx, next) => {
        const { selectedBlocks } = ctx;
        assertExists(selectedBlocks);

        const selectedInlineEditors = getSelectedInlineEditors(
          selectedBlocks,
          inlineRoot =>
            inlineRoot.inlineEditor.yTextLength > 0
              ? inlineRoot.inlineEditor
              : []
        );

        const result = handler('block', selectedInlineEditors);
        if (!result) return false;
        if (result === true) {
          return next();
        }
        return next(result);
      }),
    // native selection, corresponding to `formatNative` command
    chain.inline<InlineOut>((ctx, next) => {
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
          const block = el.closest<BlockComponent>(`[${BLOCK_ID_ATTR}]`);
          if (block) {
            return FORMAT_NATIVE_SUPPORT_FLAVOURS.includes(block.model.flavour);
          }
          return false;
        })
        .map((el): AffineInlineEditor => el.inlineEditor);

      const result = handler('native', selectedInlineEditors);
      if (!result) return false;
      if (result === true) {
        return next();
      }
      return next(result);
    }),
  ]);
}

export function getCombinedTextStyle(chain: Chain<InitCommandCtx>) {
  return handleCurrentSelection<'textStyle'>(chain, (type, inlineEditors) => {
    if (type === 'text') {
      return {
        textStyle: getCombinedFormatFromInlineEditors(
          inlineEditors.map(e => [e, e.getInlineRange()])
        ),
      };
    }
    if (type === 'block') {
      return {
        textStyle: getCombinedFormatFromInlineEditors(
          inlineEditors.map(e => [e, { index: 0, length: e.yTextLength }])
        ),
      };
    }
    if (type === 'native') {
      return {
        textStyle: getCombinedFormatFromInlineEditors(
          inlineEditors.map(e => [e, e.getInlineRange()])
        ),
      };
    }
    return false;
  });
}

export function isFormatSupported(chain: Chain<InitCommandCtx>) {
  return handleCurrentSelection(
    chain,
    (_type, inlineEditors) => inlineEditors.length > 0
  );
}

// When the user selects a range, check if it matches the previous selection.
// If it does, apply the marks from the previous selection.
// If it does not, remove the marks from the previous selection.
export function clearMarksOnDiscontinuousInput(
  inlineEditor: InlineEditor
): void {
  let inlineRange = inlineEditor.getInlineRange();
  const dispose = effect(() => {
    const r = inlineEditor.inlineRange$.value;
    if (
      inlineRange &&
      r &&
      (inlineRange.index === r.index || inlineRange.index === r.index + 1)
    ) {
      inlineRange = r;
    } else {
      inlineEditor.resetMarks();
      dispose();
    }
  });
}
