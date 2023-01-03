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
  handleBackspace,
  handleBlockSelectionBatchDelete,
  handleSelectAll,
  removeCommonHotKey,
  updateSelectedTextType,
} from '../utils/index.js';
import type { DefaultPageSignals } from './default-page-block.js';
import type { DefaultSelectionManager } from './selection-manager.js';
import type { CodeBlockOption } from './default-page-block.js';

export function getBlockEditingStateByPosition(
  blocks: BaseBlockModel[],
  x: number,
  y: number
) {
  for (let index = 0; index <= blocks.length - 1; index++) {
    const hoverDom = getBlockById(blocks[index].id);

    let blockRect;
    if (blocks[index].type === 'image') {
      const hoverImage = hoverDom?.querySelector('img');
      blockRect = hoverImage?.getBoundingClientRect();
    } else {
      blockRect = hoverDom?.getBoundingClientRect();
    }

    assertExists(blockRect);
    if (isPointIn(blockRect, x, y)) {
      return {
        position: blockRect,
        model: blocks[index],
      };
    }
  }
  return null;
}

export const getHoverBlockOptionByPosition = (
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  flavours: string[],
  targetSelector: string
) => {
  while (blocks.length) {
    const blockModel = blocks.shift();
    assertExists(blockModel);
    blockModel.children && blocks.push(...blockModel.children);
    if (matchFlavours(blockModel, flavours)) {
      const hoverDom = getBlockById(blockModel.id);
      const hoverTarget = hoverDom?.querySelector(targetSelector);
      const imageRect = hoverTarget?.getBoundingClientRect();
      assertExists(imageRect);
      if (isPointIn(imageRect, x, y)) {
        return {
          position: {
            x: imageRect.right + 10,
            y: imageRect.top,
          },
          model: blockModel,
        };
      }
    }
  }
  return null;
};

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

export async function copyImgToClip(model: BaseBlockModel) {
  const url = await getUrlByModel(model);
  assertExists(url);

  const newImage = new Image();
  newImage.src = url;
  newImage.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = newImage.width;
    canvas.height = newImage.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(newImage, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
      }
    });
  };
  toast('Copied image to clipboard');
}

export function focusCaption(model: BaseBlockModel) {
  const dom = getBlockElementByModel(model)?.querySelector(
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
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    SHIFT_UP,
    SHIFT_DOWN,
    NUMBERED_LIST,
    BULLETED,
    TEXT,
    UP,
    DOWN,
    LEFT,
    RIGHT,
    ENTER,
    CODE_BLOCK,
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

  hotkey.addListener(BACKSPACE, e => {
    const { state } = selection;
    if (state.type === 'native') {
      handleBackspace(page, e);
      return;
    } else if (['block', 'divider', 'focus'].includes(state.type)) {
      const { selectedBlocks } = state;
      if (state.type === 'focus') {
        state.type = 'block';
        return;
      }
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

  hotkey.addListener(H1, () => {
    updateSelectedTextType('affine:paragraph', 'h1', page);
  });
  hotkey.addListener(H2, () => {
    updateSelectedTextType('affine:paragraph', 'h2', page);
  });
  hotkey.addListener(H3, () => {
    updateSelectedTextType('affine:paragraph', 'h3', page);
  });
  hotkey.addListener(H4, () => {
    updateSelectedTextType('affine:paragraph', 'h4', page);
  });
  hotkey.addListener(H5, () => {
    updateSelectedTextType('affine:paragraph', 'h5', page);
  });
  hotkey.addListener(H6, () => {
    updateSelectedTextType('affine:paragraph', 'h6', page);
  });
  hotkey.addListener(NUMBERED_LIST, () => {
    updateSelectedTextType('affine:list', 'numbered', page);
  });
  hotkey.addListener(BULLETED, () => {
    updateSelectedTextType('affine:list', 'bulleted', page);
  });
  hotkey.addListener(TEXT, () => {
    updateSelectedTextType('affine:paragraph', 'text', page);
  });
  hotkey.addListener(SHIFT_UP, e => {
    // TODO expand selection up
  });
  hotkey.addListener(SHIFT_DOWN, e => {
    // TODO expand selection down
  });
  hotkey.addListener(CODE_BLOCK, e => {
    const startModel = getStartModelBySelection();
    const parent = page.getParent(startModel);
    const index = parent?.children.indexOf(startModel);
    assertExists(parent);
    const blockProps = {
      flavour: 'affine:code',
      text: startModel.text?.clone(),
    };
    page.deleteBlock(startModel);
    page.addBlock(blockProps, parent, index);
  });

  // !!!
  // Don't forget to remove hotkeys at `_removeHotkeys`
}

export function removeHotkeys() {
  removeCommonHotKey();
  hotkey.removeListener([
    HOTKEYS.BACKSPACE,
    HOTKEYS.SELECT_ALL,
    HOTKEYS.H1,
    HOTKEYS.H2,
    HOTKEYS.H3,
    HOTKEYS.H4,
    HOTKEYS.H5,
    HOTKEYS.H6,
    HOTKEYS.SHIFT_UP,
    HOTKEYS.SHIFT_DOWN,
    HOTKEYS.BULLETED,
    HOTKEYS.NUMBERED_LIST,
    HOTKEYS.TEXT,
    HOTKEYS.UP,
    HOTKEYS.DOWN,
    HOTKEYS.LEFT,
    HOTKEYS.RIGHT,
    HOTKEYS.CODE_BLOCK,
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
  const quill = richText?.quill;
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
