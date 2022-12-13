import type { BaseBlockModel, Page } from '@blocksuite/store';
import { toast } from '../../components/toast';
import { isAtLineEdge } from '../../__internal__/rich-text/rich-text-operations';
import {
  assertExists,
  caretRangeFromPoint,
  focusNextBlock,
  focusPreviousBlock,
  BLOCK_ID_ATTR,
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
} from '../../__internal__/utils';
import type { PageBlockModel } from '../page-model';
import {
  batchUpdateTextType,
  bindCommonHotkey,
  handleBackspace,
  handleBlockSelectionBatchDelete,
  handleSelectAll,
  removeCommonHotKey,
  updateTextType,
} from '../utils';
import type { DefaultPageSignals } from './default-page-block';
import type { DefaultSelectionManager } from './selection-manager';
import type { CodeBlockOption } from './default-page-block';

export function getBlockOptionByPosition(
  blocks: BaseBlockModel[],
  x: number,
  y: number,
  flavours: string[],
  targetSelector: string
) {
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
}

function isPointIn(block: DOMRect, x: number, y: number): boolean {
  if (
    x < block.left ||
    x > block.left + block.width + 50 ||
    y < block.top ||
    // when block height is smaller than height of option menu, need a stricter value to prevent bar disappear
    y > block.top + Math.max(block.height, 120)
  ) {
    return false;
  }
  return true;
}

export function downloadImage(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.download = 'test';
  link.click();
  document.body.removeChild(link);
  link.remove();
}

export async function copyImgToClip(imgURL: string) {
  const data = await fetch(imgURL);
  const blob = await data.blob();
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
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
        matchFlavours(activePreNodeModel, ['affine:group'])
      ) {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
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
  } = HOTKEYS;

  bindCommonHotkey(page);
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

      state.clear();
      signals.updateSelectedRects.emit([]);
      signals.updateEmbedRects.emit([]);
      signals.updateEmbedEditingState.emit(null);
      return;
    }
    if (isPageTitle(e)) {
      const target = e.target as HTMLInputElement;
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
    handleSelectAll();
    selection.state.type = 'native';
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

  hotkey.addListener(H1, () =>
    updateType('affine:paragraph', 'h1', page, selection)
  );
  hotkey.addListener(H2, () =>
    updateType('affine:paragraph', 'h2', page, selection)
  );
  hotkey.addListener(H3, () =>
    updateType('affine:paragraph', 'h3', page, selection)
  );
  hotkey.addListener(H4, () =>
    updateType('affine:paragraph', 'h4', page, selection)
  );
  hotkey.addListener(H5, () =>
    updateType('affine:paragraph', 'h5', page, selection)
  );
  hotkey.addListener(H6, () =>
    updateType('affine:paragraph', 'h6', page, selection)
  );
  hotkey.addListener(NUMBERED_LIST, () =>
    updateType('affine:list', 'numbered', page, selection)
  );
  hotkey.addListener(BULLETED, () =>
    updateType('affine:list', 'bulleted', page, selection)
  );
  hotkey.addListener(TEXT, () =>
    updateType('affine:paragraph', 'text', page, selection)
  );
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
  ]);
}

export function updateType(
  flavour: string,
  type: string,
  page: Page,
  selection: DefaultSelectionManager
) {
  const { state } = selection;
  if (state.selectedBlocks.length > 0) {
    batchUpdateTextType(
      flavour,
      page,
      state.selectedBlocks.map(block => getModelByElement(block)),
      type
    );
  } else {
    updateTextType(flavour, type, page);
  }
}

function removeCodeBlockOptionMenu() {
  document.querySelector(`.affine-codeblock-option-container`)?.remove();
}

export function copyCode(codeBlockOption: CodeBlockOption) {
  const richText = getRichTextByModel(codeBlockOption.model);
  assertExists(richText);
  const quill = richText?.quill;
  quill.setSelection(0, quill.getLength());
  document.dispatchEvent(new ClipboardEvent('copy'));
  resetNativeSelection(null);
  toast('Copied to clipboard');
  removeCodeBlockOptionMenu();
}

export function deleteCodeBlock(codeBlockOption: CodeBlockOption) {
  const model = codeBlockOption.model;
  model.page.deleteBlock(model);
  removeCodeBlockOptionMenu();
}

export function toggleWrap(codeBlockOption: CodeBlockOption) {
  const syntaxElem = document.querySelector(
    `[${BLOCK_ID_ATTR}="${codeBlockOption.model.id}"] .ql-syntax`
  );
  assertExists(syntaxElem);
  syntaxElem.classList.toggle('wrap');
  removeCodeBlockOptionMenu();
}
