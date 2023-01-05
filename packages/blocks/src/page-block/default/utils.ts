import type { BaseBlockModel, Page } from '@blocksuite/store';
import { toast } from '../../components/toast.js';
import { isAtLineEdge } from '../../__internal__/rich-text/rich-text-operations.js';
import {
  assertExists,
  asyncFocusRichText,
  caretRangeFromPoint,
  focusNextBlock,
  focusPreviousBlock,
  getBlockById,
  getBlockElementByModel,
  getContainerByModel,
  getDefaultPageBlock,
  getModelByElement,
  getPreviousBlock,
  getSplicedTitle,
  getStartModelBySelection,
  hotkey,
  HOTKEYS,
  isPageTitle,
  getRichTextByModel,
  matchFlavours,
  noop,
  Point,
  resetNativeSelection,
  BLOCK_ID_ATTR,
} from '../../__internal__/utils/index.js';
import type { PageBlockModel } from '../page-model.js';
import {
  bindCommonHotkey,
  handleMultiBlockBackspace,
  handleBlockSelectionBatchDelete,
  handleSelectAll,
  removeCommonHotKey,
} from '../utils/index.js';
import type { DefaultPageSignals } from './default-page-block.js';
import type { DefaultSelectionManager } from './selection-manager.js';
import type { CodeBlockOption } from './default-page-block.js';
import type { EmbedBlockModel } from '../../embed-block/embed-model.js';

export function getBlockEditingStateByPosition(
  blocks: BaseBlockModel[],
  x: number,
  y: number
) {
  for (let index = 0; index <= blocks.length - 1; index++) {
    const block = blocks[index];
    const hoverDom = getBlockById(block.id);
    // code block use async loading
    if (block.flavour === 'affine:code' && !hoverDom) {
      continue;
    }

    let blockRect;
    if (block.type === 'image') {
      const hoverImage = hoverDom?.querySelector('img');
      blockRect = hoverImage?.getBoundingClientRect();
    } else {
      blockRect = hoverDom?.getBoundingClientRect();
    }

    assertExists(blockRect);
    if (isPointIn(blockRect, x, y)) {
      return {
        position: blockRect,
        model: block,
      };
    }
  }
  return null;
}

function isPointIn(block: DOMRect, x: number, y: number): boolean {
  if (
    x < block.left ||
    x > block.left + block.width + 50 ||
    y < block.top ||
    y > block.top + block.height
  ) {
    return false;
  }
  return true;
}

export async function downloadImage(model: BaseBlockModel) {
  const imgSrc = await getUrlByModel(model);
  const image = new Image();
  imgSrc && (image.src = imgSrc);
  image.setAttribute('crossOrigin', 'anonymous');
  image.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context && context.drawImage(image, 0, 0, image.width, image.height);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const event = new MouseEvent('click');
    a.download = 'image';
    a.href = url;
    a.dispatchEvent(event);
  };
}

export async function copyImage(model: EmbedBlockModel) {
  const copyType = 'blocksuite/x-c+w';
  const text = model.block2Text('', 0, 0);
  const delta = [
    {
      insert: text,
    },
  ];
  const copyData = JSON.stringify({
    data: [
      {
        type: model.type,
        sourceId: model.sourceId,
        width: model.width,
        height: model.height,
        caption: model.caption,
        flavour: model.flavour,
        text: delta,
        children: model.children,
      },
    ],
  });
  const copySuccess = performNativeCopy([
    { mimeType: copyType, data: copyData },
  ]);
  copySuccess && toast('Copied image to clipboard');
}

interface ClipboardItem {
  mimeType: string;
  data: string;
}

function performNativeCopy(items: ClipboardItem[]): boolean {
  let success = false;
  const tempElem = document.createElement('textarea');
  tempElem.value = 'temp';
  document.body.appendChild(tempElem);
  tempElem.select();
  tempElem.setSelectionRange(0, tempElem.value.length);

  const listener = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      items.forEach(item => clipboardData.setData(item.mimeType, item.data));
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
}

export function focusCaption(model: BaseBlockModel) {
  const blockEle = getBlockElementByModel(model);
  assertExists(blockEle);
  const dom = blockEle.querySelector(
    '.affine-embed-wrapper-caption'
  ) as HTMLInputElement;
  dom.classList.add('caption-show');
  dom.focus();
}

export function handleUp(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals,
  e: KeyboardEvent
) {
  const nativeSelection = window.getSelection();
  if (nativeSelection?.anchorNode) {
    const model = getStartModelBySelection();
    const activeContainer = getContainerByModel(model);
    const activePreNodeModel = getPreviousBlock(activeContainer, model.id);
    const editableContainer = getBlockElementByModel(model)?.querySelector(
      '.ql-editor'
    ) as HTMLElement;
    const range = nativeSelection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      // FIXME: Then it will turn the input into the div
      if (
        activePreNodeModel &&
        matchFlavours(activePreNodeModel, ['affine:frame'])
      ) {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLTextAreaElement
        ).focus();
      } else {
        focusPreviousBlock(model, new Point(left, top));
      }
    }
  } else {
    signals.updateSelectedRects.emit([]);
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const container = getContainerByModel(selectedModel);
    const preNodeModel = getPreviousBlock(container, selectedModel.id);
    assertExists(preNodeModel);
    const page = getDefaultPageBlock(selectedModel);
    e.preventDefault();
    focusPreviousBlock(
      selectedModel,
      page.lastSelectionPosition instanceof Point
        ? page.lastSelectionPosition
        : 'end'
    );
  }
}

export function handleDown(
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals,
  e: KeyboardEvent
) {
  if (!selection.state.selectedBlocks.length) {
    const nativeSelection = window.getSelection();
    const model = getStartModelBySelection();
    if (matchFlavours(model, ['affine:code'])) {
      return;
    }
    assertExists(nativeSelection);
    const range = nativeSelection.getRangeAt(0);
    const { left, bottom } = range.getBoundingClientRect();
    focusNextBlock(model, new Point(left, bottom));
  } else {
    signals.updateSelectedRects.emit([]);
    const { state } = selection;
    const selectedModel = getModelByElement(state.selectedBlocks[0]);
    const container = getContainerByModel(selectedModel);
    const preNodeModel = getPreviousBlock(container, selectedModel.id);
    assertExists(preNodeModel);
    const page = getDefaultPageBlock(selectedModel);
    e.preventDefault();
    focusNextBlock(
      selectedModel,
      page.lastSelectionPosition instanceof Point
        ? page.lastSelectionPosition
        : 'start'
    );
    return;
  }
}

export function bindHotkeys(
  page: Page,
  selection: DefaultSelectionManager,
  signals: DefaultPageSignals,
  pageModel: PageBlockModel
) {
  const {
    BACKSPACE,
    SELECT_ALL,

    SHIFT_UP,
    SHIFT_DOWN,

    UP,
    DOWN,
    LEFT,
    RIGHT,
    ENTER,
  } = HOTKEYS;

  bindCommonHotkey(page);

  hotkey.addListener(ENTER, e => {
    const { type, selectedBlocks } = selection.state;
    const targetInput = e.target as HTMLElement;
    const isCaption = targetInput.classList.contains(
      'affine-embed-wrapper-caption'
    );
    // select blocks or focus caption input, then enter will create a new block.
    if ((type === 'block' && selectedBlocks.length) || isCaption) {
      e.stopPropagation();
      e.preventDefault();
      const element = isCaption
        ? targetInput
        : selectedBlocks[selectedBlocks.length - 1];
      const model = getModelByElement(element);
      const parentModel = page.getParent(model);
      const index = parentModel?.children.indexOf(model);
      assertExists(index);
      assertExists(parentModel);
      const id = page.addBlock(
        { flavour: 'affine:paragraph', type: 'text' },
        parentModel,
        index + 1
      );
      asyncFocusRichText(page, id);
      selection.state.clear();
      selection.clearRects();
      return;
    }
  });

  const isDispatchFromCodeBlock = (e: KeyboardEvent) => {
    if (!e.target || !(e.target instanceof Element)) {
      return false;
    }
    try {
      // if the target is `body`, it will throw an error
      const model = getModelByElement(e.target);
      return matchFlavours(model, ['affine:code']);
    } catch (error) {
      // just check failed, no need to handle
      return false;
    }
  };

  hotkey.addListener(BACKSPACE, e => {
    const { state } = selection;
    if (state.type === 'none') {
      // Will be handled in the `keyboard.onBackspace` function
      return;
    }
    if (state.type === 'native') {
      handleMultiBlockBackspace(page, e);
      return;
    }

    if (state.type === 'block') {
      // XXX Ad-hoc for code block
      // At the beginning of the code block,
      // the backspace will selected the block first.
      // The select logic already processed in the `handleLineStartBackspace` function.
      // So we need to prevent the default delete behavior.
      if (isDispatchFromCodeBlock(e)) {
        return;
      }
      const { selectedBlocks } = state;

      // delete selected blocks
      handleBlockSelectionBatchDelete(
        page,
        selectedBlocks.map(block => getModelByElement(block))
      );
      e.preventDefault();
      state.clear();
      signals.updateSelectedRects.emit([]);
      signals.updateEmbedRects.emit([]);
      signals.updateEmbedEditingState.emit(null);
      return;
    }

    if (isPageTitle(e)) {
      const target = e.target as HTMLTextAreaElement;
      // range delete
      if (target.selectionStart !== target.selectionEnd) {
        e.preventDefault();
        const title = getSplicedTitle(target);
        page.updateBlock(pageModel, { title });
        page.workspace.setPageMeta(page.id, { title });
      }
      // collapsed delete
      else {
        noop();
      }
      return;
    }
  });

  hotkey.addListener(SELECT_ALL, e => {
    e.preventDefault();
    handleSelectAll(selection);
    selection.state.type = 'block';
  });

  hotkey.addListener(UP, e => {
    handleUp(selection, signals, e);
  });
  hotkey.addListener(DOWN, e => {
    handleDown(selection, signals, e);
  });
  hotkey.addListener(LEFT, e => {
    let model: BaseBlockModel | null = null;
    const {
      state: { selectedBlocks, type },
    } = selection;
    if (
      selectedBlocks.length &&
      !(type === 'native' && window.getSelection()?.rangeCount)
    ) {
      model = getModelByElement(selection.state.selectedBlocks[0]);
      signals.updateSelectedRects.emit([]);
      selection.state.clear();
      e.preventDefault();
    } else {
      const range = window.getSelection()?.getRangeAt(0);
      if (range && range.collapsed && range.startOffset === 0) {
        model = getStartModelBySelection();
      }
    }
    model && focusPreviousBlock(model, 'end');
  });
  hotkey.addListener(RIGHT, e => {
    if (
      e.target instanceof HTMLTextAreaElement &&
      e.target.classList.contains('affine-default-page-block-title')
    ) {
      return;
    }
    let model: BaseBlockModel | null = null;
    const {
      state: { selectedBlocks, type },
    } = selection;
    if (
      selectedBlocks.length &&
      !(type === 'native' && window.getSelection()?.rangeCount)
    ) {
      model = getModelByElement(
        selection.state.selectedBlocks[
          selection.state.selectedBlocks.length - 1
        ]
      );
      signals.updateSelectedRects.emit([]);
      selection.state.clear();
      e.preventDefault();
    } else {
      const range = window.getSelection()?.getRangeAt(0);
      const textModel = getStartModelBySelection();
      if (
        range &&
        range.collapsed &&
        range.startOffset === textModel.text?.length
      ) {
        // handleUp(this.selection, this.signals);
        model = getStartModelBySelection();
      }
    }
    model && focusNextBlock(model, 'start');
  });

  hotkey.addListener(SHIFT_UP, e => {
    // TODO expand selection up
  });
  hotkey.addListener(SHIFT_DOWN, e => {
    // TODO expand selection down
  });

  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeHotkeys() {
  removeCommonHotKey();
  hotkey.removeListener([
    HOTKEYS.BACKSPACE,
    HOTKEYS.SELECT_ALL,

    HOTKEYS.SHIFT_UP,
    HOTKEYS.SHIFT_DOWN,

    HOTKEYS.UP,
    HOTKEYS.DOWN,
    HOTKEYS.LEFT,
    HOTKEYS.RIGHT,
    HOTKEYS.ENTER,
  ]);
}

async function getUrlByModel(model: BaseBlockModel) {
  assertExists(model.sourceId);
  const store = await model.page.blobs;
  const url = store?.get(model.sourceId);
  return url;
}

export function isControlledKeyboardEvent(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey || e.shiftKey;
}

export function copyCode(codeBlockOption: CodeBlockOption) {
  const richText = getRichTextByModel(codeBlockOption.model);
  assertExists(richText);
  const quill = richText.quill;
  quill.setSelection(0, quill.getLength());
  document.dispatchEvent(new ClipboardEvent('copy'));
  resetNativeSelection(null);
  toast('Copied to clipboard');
}

export function deleteCodeBlock(codeBlockOption: CodeBlockOption) {
  const model = codeBlockOption.model;
  model.page.deleteBlock(model);
}

export function toggleWrap(codeBlockOption: CodeBlockOption) {
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  assertExists(syntaxElem);
  syntaxElem.classList.toggle('wrap');
}
