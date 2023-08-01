import { BlockSelection, TextSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import { DefaultPageBlockComponent } from '../../../page-block/default/default-page-block.js';
import type { EdgelessPageBlockComponent } from '../../../page-block/edgeless/edgeless-page-block.js';
import { ContentParser } from '../../content-parser/index.js';
import { getService } from '../../service.js';
import {
  type BlockRange,
  getCurrentNativeRange,
  getEdgelessCanvasTextEditor,
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
  selectedModels?: Map<string, number>,
  begin?: number,
  end?: number
) {
  const service = getService(model.flavour);
  const html = service.block2html(model, { begin, end });
  const text = service.block2Text(model, { begin, end });
  // FIXME: the presence of children is not considered
  // Children json info is collected by its parent, but getCurrentBlockRange.models return parent and children at same time, it should be separated
  const json = service.block2Json(model, selectedModels, begin, end);

  return {
    html,
    text,
    json,
    model,
  };
}

function legacyCreatePageClipboardItems(range: BlockRange) {
  const uniqueModelsFilter = new Map();
  const addToFilter = (model: BaseBlockModel, index: number) => {
    uniqueModelsFilter.set(model.id, index);
    model.children?.forEach(child => addToFilter(child, index));
  };

  const selectedModels = new Map();

  range.models.forEach((model, index) => {
    selectedModels.set(model.id, index);
  });

  const clipGroups = range.models
    .filter((model, index) => {
      if (uniqueModelsFilter.has(model.id)) {
        uniqueModelsFilter.set(model.id, index);
        return false;
      }
      addToFilter(model, index);
      return true;
    })
    .map((model, index, array) => {
      if (index === 0) {
        return getBlockClipboardInfo(
          model,
          selectedModels,
          range.startOffset,
          index === array.length - 1 ? range.endOffset : undefined
        );
      }
      if (index === array.length - 1) {
        return getBlockClipboardInfo(
          model,
          selectedModels,
          undefined,
          range.endOffset
        );
      }
      return getBlockClipboardInfo(model, selectedModels);
    });

  const stringifiesData = JSON.stringify(
    clipGroups.filter(group => group.json).map(group => group.json)
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

function createPageClipboardItems(host: BlockElement): ClipboardItem[] {
  //TODO: support edgeless page
  if (!(host instanceof DefaultPageBlockComponent)) {
    throw new Error(
      '`createPageClipboardItems` only support `DefaultPageBlockComponent`'
    );
  }

  const root = host.root;
  const selectionManager = root.selectionManager;
  const selections = selectionManager.value;

  if (selections.length === 0) {
    return [];
  }

  const selectedBlocks: BaseBlockModel[] = [];
  const textSelection = selections.find(
    selection => selection instanceof TextSelection
  ) as TextSelection | undefined;
  const blockSelections = selections.filter(
    selection => selection instanceof BlockSelection
  );

  if (textSelection) {
    const rangeController = host.rangeController;
    const range = rangeController.value;
    selectedBlocks.push(
      ...rangeController.getSelectedBlocksId(range).map(id => {
        const block = host.page.getBlockById(id);
        assertExists(block);
        return block;
      })
    );
  } else if (blockSelections.length > 0) {
    selectedBlocks.push(
      ...blockSelections.map(selection => {
        const block = host.page.getBlockById(selection.blockId);
        assertExists(block);
        return block;
      })
    );
  } else {
    return [];
  }

  const selectedBlocksMap = new Map();
  selectedBlocks.forEach((model, index) => {
    selectedBlocksMap.set(model.id, index);
  });

  const uniqueModelsFilter = new Map();
  const addToFilter = (model: BaseBlockModel, index: number) => {
    uniqueModelsFilter.set(model.id, index);
    model.children?.forEach(child => addToFilter(child, index));
  };

  const clipGroups = selectedBlocks
    .filter((model, index) => {
      if (uniqueModelsFilter.has(model.id)) {
        uniqueModelsFilter.set(model.id, index);
        return false;
      }
      addToFilter(model, index);
      return true;
    })
    .map((model, index, array) => {
      if (index === 0) {
        return getBlockClipboardInfo(
          model,
          selectedBlocksMap,
          textSelection?.from.index,
          index === array.length - 1
            ? textSelection?.to?.index
              ? textSelection?.to?.index + length
              : undefined
            : undefined
        );
      }
      if (index === array.length - 1) {
        return getBlockClipboardInfo(
          model,
          selectedBlocksMap,
          undefined,
          textSelection?.to?.index
            ? textSelection?.to?.index + length
            : undefined
        );
      }
      return getBlockClipboardInfo(model, selectedBlocksMap);
    });

  const stringifiesData = JSON.stringify(
    clipGroups.filter(group => group.json).map(group => group.json)
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

export function legacyCopyBlocks(range: BlockRange) {
  const clipboardItems = legacyCreatePageClipboardItems(range);

  const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;

  performNativeCopy(clipboardItems);

  if (savedRange) {
    resetNativeSelection(savedRange);
  }
}

export function copyBlocks(host: BlockElement): void {
  const clipboardItems = createPageClipboardItems(host);

  const root = host.root;
  const selectionManager = root.selectionManager;
  const selections = selectionManager.value;
  performNativeCopy(clipboardItems);
  selectionManager.set(selections);
}

export async function textedClipboardData2Blocks(
  page: Page,
  clipboardData: ClipboardEvent['clipboardData']
) {
  if (!clipboardData) {
    return [];
  }

  const contentParser = new ContentParser(page);
  const HTMLClipboardData = clipboardData.getData(CLIPBOARD_MIMETYPE.HTML);

  if (HTMLClipboardData) {
    const blockSuiteClipboardData = extractCustomDataFromHTMLString(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_PAGE,
      HTMLClipboardData
    );

    if (blockSuiteClipboardData) {
      return JSON.parse(blockSuiteClipboardData) as SerializedBlock[];
    }
  }

  const textClipData = clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT);

  return contentParser.text2blocks(textClipData);
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
      HTMLClipboardData
    );

    if (blockSuiteClipboardData) {
      return JSON.parse(blockSuiteClipboardData) as SerializedBlock[];
    }
  }

  const textClipData = clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT);

  const isHTMLContainCode = /<code/.test(HTMLClipboardData);
  const shouldConvertMarkdown =
    !isHTMLContainCode && markdownUtils.checkIfTextContainsMd(textClipData);

  if (HTMLClipboardData && !shouldConvertMarkdown) {
    const htmlSerializedBlocks = await contentParser.htmlText2Block(
      removeFragmentFromHtmlClipboardString(HTMLClipboardData)
    );
    if (htmlSerializedBlocks.length) {
      return htmlSerializedBlocks;
    }
  }

  if (shouldConvertMarkdown) {
    return await contentParser.markdown2Block(textClipData);
  }

  return contentParser.text2blocks(textClipData);
}

// https://learn.microsoft.com/en-us/windows/win32/dataxchg/html-clipboard-format
export function removeFragmentFromHtmlClipboardString(html: string) {
  return html.replace(/<!--StartFragment-->([^]*)<!--EndFragment-->/g, '$1');
}

export function copyOnPhasorElementWithText(
  edgeless: EdgelessPageBlockComponent
) {
  const edgelessTextEditor = getEdgelessCanvasTextEditor(edgeless);
  if (edgelessTextEditor) {
    const vEditor = edgelessTextEditor.vEditor;
    assertExists(vEditor);
    const vRange = vEditor.getVRange();
    if (vRange) {
      const text = vEditor.yText
        .toString()
        .slice(vRange.index, vRange.index + vRange.length);
      const clipboardItem = new ClipboardItem(CLIPBOARD_MIMETYPE.TEXT, text);

      edgelessTextEditor.setKeeping(true);
      // this function will make virgo editor lose focus
      performNativeCopy([clipboardItem]);
      edgelessTextEditor.setKeeping(false);

      // restore focus and selection
      vEditor.rootElement.focus();
      vEditor.setVRange(vRange);
    }
  }
}
