import type { BaseBlockModel, Page } from '@blocksuite/store';

import { ContentParser } from '../../content-parser/index.js';
import { getService } from '../../service.js';
import {
  type BlockRange,
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
  type SerializedBlock,
} from '../../utils/index.js';
import { ClipboardItem } from '../clipboard-item.js';
import markdownUtils from './markdown.js';
import {
  CLIPBOARD_MIMETYPE,
  createHTMLStringForCustomData,
  extractCustomDataFromHTMLString,
  isPureFileInClipboard,
  performNativeCopy,
} from './pure.js';

export function getBlockClipboardInfo(
  model: BaseBlockModel,
  begin?: number,
  end?: number
) {
  const service = getService(model.flavour);
  const html = service.block2html(model, { begin, end });
  const text = service.block2Text(model, { begin, end });
  // FIXME: the presence of children is not considered
  // Children json info is collected by its parent, but getCurrentBlockRange.models return parent and children at same time, it should be separated
  const json = service.block2Json(model, begin, end);

  return {
    html,
    text,
    json,
    model,
  };
}

function createPageClipboardItems(range: BlockRange) {
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

  const stringifiesData = JSON.stringify(
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
  );

  // Compatibility handling: In some environments, browsers do not support clipboard mime type other than `text/html` and `text/plain`, so need to store the copied json information in html
  // Playwright issue: https://github.com/microsoft/playwright/issues/18013
  const customClipboardFragment = createHTMLStringForCustomData(
    stringifiesData,
    CLIPBOARD_MIMETYPE.BLOCKSUITE_PAGE
  );

  const textClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.TEXT,
    clipGroups.reduce((text, group, index) => {
      return `${text}${group.text}${
        index === clipGroups.length - 1 ? '' : '\n'
      }`;
    }, '')
  );
  const htmlClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.HTML,
    `${clipGroups.map(group => group.html).join('')}${customClipboardFragment}`
  );
  const pageClipboardItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.BLOCKSUITE_PAGE,
    stringifiesData
  );

  return [textClipboardItem, htmlClipboardItem, pageClipboardItem];
}

export function copyBlocks(range: BlockRange) {
  const clipboardItems = createPageClipboardItems(range);

  const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;

  performNativeCopy(clipboardItems);

  if (savedRange) {
    resetNativeSelection(savedRange);
  }
}

function isChildBlock(blocks: BaseBlockModel[], block: BaseBlockModel) {
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
}

export async function clipboardData2Blocks(
  page: Page,
  clipboardData: ClipboardEvent['clipboardData']
) {
  if (!clipboardData) {
    return [];
  }

  const contentParser = new ContentParser(page);
  if (isPureFileInClipboard(clipboardData)) {
    return contentParser.file2Blocks(clipboardData);
  }

  const HTMLClipboardData = clipboardData.getData(CLIPBOARD_MIMETYPE.HTML);
  if (HTMLClipboardData) {
    const blockSuiteClipboardData = extractCustomDataFromHTMLString(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_PAGE,
      clipboardData.getData(CLIPBOARD_MIMETYPE.HTML)
    );

    if (blockSuiteClipboardData) {
      return JSON.parse(blockSuiteClipboardData) as SerializedBlock[];
    }
  }

  const textClipData = clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT);
  const shouldConvertMarkdown =
    markdownUtils.checkIfTextContainsMd(textClipData);
  if (HTMLClipboardData && !shouldConvertMarkdown) {
    return await contentParser.htmlText2Block(HTMLClipboardData);
  }

  if (shouldConvertMarkdown) {
    return await contentParser.markdown2Block(textClipData);
  }

  return contentParser.text2blocks(textClipData);
}
