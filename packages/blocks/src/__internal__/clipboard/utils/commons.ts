import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type BaseBlockModel, type Page } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../../page-block/edgeless/edgeless-page-block.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import { getSelectedContentModels } from '../../../page-block/utils/selection.js';
import { ContentParser } from '../../content-parser/index.js';
import type { SelectedBlock } from '../../content-parser/types.js';
import { getService } from '../../service/index.js';
import { registerAllBlocks } from '../../service/legacy-services/index.js';
import {
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

export async function getBlockClipboardInfo(
  block: SelectedBlock,
  blockModelMap: Map<string, BaseBlockModel>
): Promise<{ html: string; text: string; json: SerializedBlock }> {
  const model = blockModelMap.get(block.id);
  assertExists(model);

  const childrenHtml: string[] = [];
  const childrenText: string[] = [];
  const childrenJson: SerializedBlock[] = [];
  for (
    let currentIndex = 0;
    currentIndex < block.children.length;
    currentIndex++
  ) {
    const { html, text, json } = await getBlockClipboardInfo(
      block.children[currentIndex],
      blockModelMap
    );
    html && childrenHtml.push(html);
    text && childrenText.push(text);
    childrenJson.push(json);
  }

  const service = await getService(model.flavour);

  const html = await service.block2html(model, {
    childText: childrenHtml.join(''),
    begin: block.startPos,
    end: block.endPos,
  });

  const text = service.block2Text(model, {
    childText: childrenText.join(''),
    begin: block.startPos,
    end: block.endPos,
  });

  const json = service.block2Json(model, block.startPos, block.endPos);
  json.children = childrenJson;

  return {
    html,
    text,
    json,
  };
}

async function createPageClipboardItems(
  selectedModels: BaseBlockModel[],
  textSelection?: TextSelection
): Promise<ClipboardItem[]> {
  const uniqueModelsFilter = new Map();
  const addToFilter = (model: BaseBlockModel, index: number) => {
    uniqueModelsFilter.set(model.id, index);
    model.children?.forEach(child => addToFilter(child, index));
  };

  const selectedModelsMap = new Map();
  selectedModels.forEach((model, index) => {
    selectedModelsMap.set(model.id, index);
  });

  const selectedModelMap = new Map();
  selectedModels.forEach(model => {
    selectedModelMap.set(model.id, model);
  });

  const blocks: SelectedBlock[] = [];
  const parentIdMap = new Map<string, string>();
  const blocksMap = new Map<string, SelectedBlock>();
  selectedModels.forEach(model => {
    for (const child of model.children) {
      if (selectedModelsMap.has(child.id)) {
        parentIdMap.set(child.id, model.id);
      } else {
        break;
      }
    }
    const parentBlockChildren =
      blocksMap.get(parentIdMap.get(model.id) ?? '')?.children ?? blocks;
    const startPos =
      selectedModelsMap.get(model.id) == 0
        ? textSelection?.from.index
        : undefined;
    let endPos = undefined;
    if (selectedModelsMap.get(model.id) == selectedModels.length - 1) {
      if (textSelection?.to) {
        endPos = textSelection.to.index + textSelection.to.length;
      } else if (textSelection?.from) {
        endPos = textSelection?.from.index + textSelection?.from.length;
      }
    }
    const block: SelectedBlock = {
      id: model.id,
      startPos,
      endPos,
      children: [] as SelectedBlock[],
    };
    blocksMap.set(model.id, block);
    parentBlockChildren.push(block);
  });

  registerAllBlocks();
  const clipGroups = await Promise.all(
    blocks.map(async block => {
      return await getBlockClipboardInfo(block, selectedModelMap);
    })
  );

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

export async function copyBlocksInPage(pageElement: PageBlockComponent) {
  const selectedModels = getSelectedContentModels(pageElement, [
    'text',
    'block',
  ]);
  const textSelection = pageElement.selection.find('text');
  const clipboardItems = await createPageClipboardItems(
    selectedModels,
    textSelection
  );

  const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;

  performNativeCopy(clipboardItems);

  if (savedRange) {
    resetNativeSelection(savedRange);
  }
}

export async function copyBlocks(models: BaseBlockModel[]) {
  const clipboardItems = await createPageClipboardItems(models);
  const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;
  performNativeCopy(clipboardItems);

  if (savedRange) {
    resetNativeSelection(savedRange);
  }
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
