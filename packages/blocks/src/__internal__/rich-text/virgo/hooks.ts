import type {
  VBeforeinputHookCtx,
  VCompositionEndHookCtx,
  VHookContext,
} from '@blocksuite/virgo';

import { isStrictUrl } from '../../utils/url.js';
import type { AffineTextAttributes } from './types.js';

const EDGE_IGNORED_ATTRIBUTES = ['code', 'reference'] as const;
const GLOBAL_IGNORED_ATTRIBUTES = ['reference'] as const;

const autoIdentifyLink = (ctx: VHookContext<AffineTextAttributes>) => {
  if (ctx.attributes?.link && ctx.data === ' ') {
    delete ctx.attributes['link'];
    return;
  }

  if (ctx.attributes?.link) {
    const linkDeltaInfo = ctx.vEditor.deltaService
      .getDeltasByVRange(ctx.vRange)
      .filter(([delta]) => delta.attributes?.link)[0];
    const [delta, { index, length }] = linkDeltaInfo;
    const rangePositionInDelta = ctx.vRange.index - index;

    //It means the link has been custom edited
    if (delta.attributes?.link !== delta.insert) {
      // If the cursor is at the end of the link, we should not auto identify it
      if (rangePositionInDelta === length) {
        delete ctx.attributes['link'];
        return;
      }
      // If the cursor is not at the end of the link, we should only update the link text
      return;
    }
    const newText =
      delta.insert.slice(0, rangePositionInDelta) +
      ctx.data +
      delta.insert.slice(rangePositionInDelta);
    const isUrl = isStrictUrl(newText);

    // If the new text with original link text is not pattern matched, we should reset the text
    if (!isUrl) {
      ctx.vEditor.resetText({ index, length });
      delete ctx.attributes['link'];
      return;
    }
    // If the new text with original link text is pattern matched, we should update the link text
    ctx.vEditor.formatText(
      {
        index,
        length,
      },
      {
        link: newText,
      }
    );
    ctx.attributes = {
      ...ctx.attributes,
      link: newText,
    };
    return;
  }

  const [line] = ctx.vEditor.getLine(ctx.vRange.index);

  // In delete, context.data is null
  const insertText = ctx.data || '';
  const verifyData = `${line.textContent.slice(
    0,
    ctx.vRange.index
  )}${insertText}`.split(' ');

  const verifyStr = verifyData[verifyData.length - 1];

  const isUrl = isStrictUrl(verifyStr);

  if (!isUrl) {
    return;
  }
  const startIndex = ctx.vRange.index + insertText.length - verifyStr.length;

  ctx.vEditor.formatText(
    {
      index: startIndex,
      length: verifyStr.length,
    },
    {
      link: verifyStr,
    }
  );

  ctx.attributes = {
    ...ctx.attributes,
    link: verifyStr,
  };
};

let ifPrefixSpace = false;
export const onVBeforeinput = (
  ctx: VBeforeinputHookCtx<AffineTextAttributes>
) => {
  const { vEditor, vRange, data, raw } = ctx;
  if (vRange.length !== 0) {
    return ctx;
  }

  const deltas = vEditor.getDeltasByVRange(vRange);

  // Overwrite the default behavior (Insert period when consecutive spaces) of IME.
  if (raw.inputType === 'insertText' && data === ' ') {
    ifPrefixSpace = true;
  } else if (data !== '. ' && data !== '。 ') {
    ifPrefixSpace = false;
  }
  if (ifPrefixSpace && (data === '. ' || data === '。 ')) {
    ctx.data = ' ';
  }

  if (data && data.length > 0 && data !== '\n') {
    if (
      deltas.length > 1 || // cursor is in the between of two deltas
      (deltas.length === 1 && vRange.index !== 0) // cursor is in the end of line or in the middle of a delta
    ) {
      // each new text inserted by virgo will not contain any attributes,
      // but we want to keep the attributes of previous text or current text where the cursor is in
      // here are two cases:
      // 1. aaa**b|bb**ccc --input 'd'--> aaa**bdbb**ccc, d should extend the bold attribute
      // 2. aaa**bbb|**ccc --input 'd'--> aaa**bbbd**ccc, d should extend the bold attribute
      const { attributes } = deltas[0][0];
      if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
        // `EDGE_IGNORED_ATTRIBUTES` is which attributes should be ignored in case 2
        EDGE_IGNORED_ATTRIBUTES.forEach(attr => {
          delete attributes?.[attr];
        });
      }

      // `GLOBAL_IGNORED_ATTRIBUTES` is which attributes should be ignored in case 1, 2
      GLOBAL_IGNORED_ATTRIBUTES.forEach(attr => {
        delete attributes?.[attr];
      });

      ctx.attributes = attributes ?? {};
    }
  }
  autoIdentifyLink(ctx);

  return ctx;
};

export const onVCompositionEnd = (
  ctx: VCompositionEndHookCtx<AffineTextAttributes>
) => {
  const { vEditor, vRange, data } = ctx;
  if (vRange.length !== 0) {
    return ctx;
  }

  const deltas = vEditor.getDeltasByVRange(vRange);
  if (data && data.length > 0 && data !== '\n') {
    if (deltas.length > 1 || (deltas.length === 1 && vRange.index !== 0)) {
      const newAttributes = deltas[0][0].attributes;
      if (deltas.length !== 1 || vRange.index === vEditor.yText.length) {
        EDGE_IGNORED_ATTRIBUTES.forEach(attr => {
          delete newAttributes?.[attr];
        });
      }

      GLOBAL_IGNORED_ATTRIBUTES.forEach(attr => {
        delete newAttributes?.[attr];
      });

      ctx.attributes = newAttributes ?? {};
    }
  }

  autoIdentifyLink(ctx);

  return ctx;
};
