import type { BaseBlockModel, Page } from '@blocksuite/store';

import { ContentParser } from '../content-parser/index.js';
import { getService } from '../service.js';
import type { BlockRange } from '../utils/index.js';
import {
  getCurrentBlockRange,
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../utils/index.js';
import { ClipboardItem } from './clipboard-item.js';
import markdownUtils from './markdown-utils.js';

export enum CLIPBOARD_MIMETYPE {
  BLOCKS_CLIP_WRAPPED = 'blocksuite/x-c+w',
  HTML = 'text/html',
  TEXT = 'text/plain',
  // IMAGE_BMP = 'image/bmp',
  // IMAGE_GIF = 'image/gif',
  // IMAGE_JPEG = 'image/jpeg',
  // IMAGE_JPG = 'image/jpg',
  // IMAGE_PNG = 'image/png',
  // IMAGE_SVG = 'image/svg',
  // IMAGE_WEBP = 'image/webp',
}

export const optimalMimeTypes: string[] = [
  CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
  CLIPBOARD_MIMETYPE.HTML,
  CLIPBOARD_MIMETYPE.TEXT,
];

export const performNativeCopy = (items: ClipboardItem[]): boolean => {
  let success = false;
  const tempElem = document.createElement('textarea');
  tempElem.value = 'temp';
  document.body.appendChild(tempElem);
  tempElem.select();
  tempElem.setSelectionRange(0, tempElem.value.length);

  const listener = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      items.forEach((item: ClipboardItem) => {
        clipboardData.setData(item.mimeType, item.data);
      });
    }

    e.preventDefault();
    e.stopPropagation();
    tempElem.removeEventListener('copy', listener);
  };

  tempElem.addEventListener('copy', listener);
  try {
    success = document.execCommand('copy');
  } finally {
    tempElem.removeEventListener('copy', listener);
    document.body.removeChild(tempElem);
  }
  return success;
};

export const isPureFileInClipboard = (clipboardData: DataTransfer) => {
  const types = clipboardData.types;
  return (
    (types.length === 1 && types[0] === 'Files') ||
    (types.length === 2 &&
      (types.includes('text/plain') || types.includes('text/html')) &&
      types.includes('Files'))
  );
};

// TODO: support more file types, now is just image
export function getFileFromClipboard(clipboardData: DataTransfer) {
  const files = clipboardData.files;
  if (files && files[0] && files[0].type.indexOf('image') > -1) {
    return files[0];
  }
  return;
}

function getOptimalClipboardData(
  clipboardData: ClipboardEvent['clipboardData']
) {
  const dv = document.createElement('div');
  document.querySelector('.affine-block-children-container')?.appendChild(dv);

  clipboardData?.items[0].getAsString(data => {
    dv.innerText += `0${data}`;
  });
  clipboardData?.items[1].getAsString(data => {
    dv.innerText += `1${data}`;
  });

  for (let i = 0; i < optimalMimeTypes.length; i++) {
    const mimeType = optimalMimeTypes[i];
    const data = clipboardData?.getData(mimeType);

    if (data) {
      return {
        type: mimeType,
        data,
      };
    }
  }
  return null;
}

export async function clipboardData2Blocks(
  page: Page,
  clipboardData: ClipboardEvent['clipboardData']
) {
  if (!clipboardData) {
    return;
  }

  const contentParser = new ContentParser(page);
  if (isPureFileInClipboard(clipboardData)) {
    return contentParser.file2Blocks(clipboardData);
  }

  const optimalClipboardData = getOptimalClipboardData(clipboardData);

  if (optimalClipboardData?.type === CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED) {
    return JSON.parse(optimalClipboardData.data);
  }

  const textClipData = clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT);
  const shouldConvertMarkdown =
    markdownUtils.checkIfTextContainsMd(textClipData);
  if (
    optimalClipboardData?.type === CLIPBOARD_MIMETYPE.HTML &&
    !shouldConvertMarkdown
  ) {
    return await contentParser.htmlText2Block(optimalClipboardData.data);
  }

  if (shouldConvertMarkdown) {
    return await contentParser.markdown2Block(textClipData);
  }

  return contentParser.text2blocks(textClipData);
}

export function shouldClipboardHandlerContinue(page: Page) {
  const range = getCurrentBlockRange(page);
  // TODO: getCurrentBlockRange should not return 'affine:page', delete this check after fix
  return range && !range.models.find(model => model.flavour === 'affine:page');
}

export function getBlockClipboardInfo(
  model: BaseBlockModel,
  begin?: number,
  end?: number
) {
  const service = getService(model.flavour);
  // FIXME: remove ts-ignore
  // @ts-ignore
  const html = service.block2html(model, { begin, end });
  // FIXME: remove ts-ignore
  // @ts-ignore
  const text = service.block2Text(model, { begin, end });
  // FIXME: the presence of children is not considered
  // Children json info is collected by its parent, but getCurrentBlockRange.models return parent and children at same time, it should be separated
  // FIXME: remove ts-ignore
  // @ts-ignore
  const json = service.block2Json(model, begin, end);

  return {
    html,
    text,
    json,
    model,
  };
}

export function copy(range: BlockRange) {
  const clipGroups = range.models.map((model, index) => {
    if (index === 0) {
      return getBlockClipboardInfo(
        model,
        range.startOffset,
        index === range.models.length - 1 ? range.endOffset : undefined
      );
    }
    if (index === range.models.length - 1) {
      return getBlockClipboardInfo(model, undefined, range.endOffset);
    }
    return getBlockClipboardInfo(model);
  });

  const textClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.TEXT,
    clipGroups.map(group => group.text).join('')
  );
  const htmlClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.HTML,
    clipGroups.map(group => group.html).join('')
  );
  const customClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
    JSON.stringify(
      clipGroups
        .filter(group => {
          if (!group.json) {
            return false;
          }
          // XXX: should handle this issue here?
          // Children json info is collected by its parent,
          // but getCurrentBlockRange.models return parent and children at same time,
          // children should be deleted from group
          return !isChildBlock(range.models, group.model);
        })
        .map(group => group.json)
    )
  );

  const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;

  performNativeCopy([
    textClipboardItem,
    htmlClipboardItem,
    customClipboardItem,
  ]);

  savedRange && resetNativeSelection(savedRange);
}

const isChildBlock = (blocks: BaseBlockModel[], block: BaseBlockModel) => {
  for (let i = 0; i < blocks.length; i++) {
    const parentBlock = blocks[i];
    if (parentBlock.children) {
      if (
        parentBlock.children.findIndex(
          childBlock => childBlock.id === block.id
        ) > -1
      ) {
        return true;
      }
      if (isChildBlock(parentBlock.children, block)) {
        return true;
      }
    }
  }
  return false;
};
