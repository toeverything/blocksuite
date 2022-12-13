import type { BaseBlockModel, Page } from '@blocksuite/store';
import { toast } from '../../components/toast';
import { isAtLineEdge } from '../../__internal__/rich-text/rich-text-operations';
import {
  assertExists,
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
  matchFlavours,
  noop,
  Point,
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
  const link = document.createElement('a');
  const url = await getUrlByModel(model);
  url && (link.href = url);
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.download = 'test';
  link.click();
  document.body.removeChild(link);
  link.remove();
}

export async function copyImgToClip(model: BaseBlockModel) {
  const url = await getUrlByModel(model);
  assertExists(url);
  const data = await fetch(url);
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
    } else if (state.type === 'block') {
      const { selectedBlocks } = state;
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

async function getUrlByModel(model: BaseBlockModel) {
  assertExists(model.sourceId);
  const store = await model.page.blobs;
  const url = store?.get(model.sourceId);
  return url;
}
