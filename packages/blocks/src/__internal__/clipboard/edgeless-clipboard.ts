import {
  type Bound,
  type PhasorElement,
  type PhasorElementType,
  TextElement,
} from '@blocksuite/phasor';
import {
  deserializeXYWH,
  getCommonBound,
  serializeXYWH,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
} from '../../page-block/edgeless/utils/consts.js';
import { isTopLevelBlock } from '../../page-block/edgeless/utils/query.js';
import type { Selectable } from '../../page-block/edgeless/utils/selection-manager.js';
import { deleteModelsByRange } from '../../page-block/utils/container-operations.js';
import type { SerializedBlock, TopLevelBlockModel } from '../index.js';
import { getService } from '../service.js';
import { addSerializedBlocks } from '../service/json2block.js';
import { activeEditorManager } from '../utils/active-editor-manager.js';
import { getCurrentBlockRange } from '../utils/block-range.js';
import { groupBy } from '../utils/common.js';
import type { Clipboard } from './type.js';
import {
  clipboardData2Blocks,
  copyBlocks,
  copySurfaceText,
  getBlockClipboardInfo,
} from './utils/commons.js';
import {
  createSurfaceClipboardItems,
  getSurfaceClipboardData,
  performNativeCopy,
} from './utils/index.js';

export class EdgelessClipboard implements Clipboard {
  private _page!: Page;
  private _edgeless: EdgelessPageBlockComponent;

  constructor(page: Page, edgeless: EdgelessPageBlockComponent) {
    this._page = page;
    this._edgeless = edgeless;
  }

  init(page: Page = this._page) {
    this._page = page;
    document.body.addEventListener('cut', this._onCut);
    document.body.addEventListener('copy', this._onCopy);
    document.body.addEventListener('paste', this._onPaste);
  }

  get selection() {
    return this._edgeless.selection;
  }

  get slots() {
    return this._edgeless.slots;
  }

  get surface() {
    return this._edgeless.surface;
  }

  public dispose() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _onCut = (e: ClipboardEvent) => {
    if (!activeEditorManager.isActive(this._edgeless)) {
      return;
    }
    e.preventDefault();
    this._onCopy(e);

    const { state } = this.selection;
    if (state.active) {
      deleteModelsByRange(this._page);
      return;
    }

    this._page.transact(() => {
      state.selected.forEach(selected => {
        if (isTopLevelBlock(selected)) {
          this._page.deleteBlock(selected);
        } else {
          this.surface.removeElement(selected.id);
        }
      });
    });
    this.slots.selectionUpdated.emit({ active: false, selected: [] });
  };

  private _onCopy = (e: ClipboardEvent) => {
    if (!activeEditorManager.isActive(this._edgeless)) {
      return;
    }
    e.preventDefault();
    const { state } = this.selection;
    // when note active, handle copy like page mode
    if (state.active) {
      if (state.selected[0] instanceof TextElement) {
        copySurfaceText(this._edgeless);
      } else {
        const range = getCurrentBlockRange(this._page);
        assertExists(range);
        copyBlocks(range);
      }
      return;
    }
    const data = state.selected
      .map(selected => {
        if (isTopLevelBlock(selected)) {
          return getBlockClipboardInfo(selected).json;
        } else {
          return selected.serialize();
        }
      })
      .filter(d => !!d);

    const clipboardItems = createSurfaceClipboardItems(data);
    performNativeCopy(clipboardItems);
  };

  private _onPaste = async (e: ClipboardEvent) => {
    if (!activeEditorManager.isActive(this._edgeless)) {
      return;
    }
    e.preventDefault();
    const { state } = this.selection;
    if (state.active) {
      if (!(state.selected[0] instanceof TextElement)) {
        this._pasteInTextNote(e);
      }
      // use build-in paste handler in virgo when paste in surface text element
      return;
    }

    const elementsRawData = getSurfaceClipboardData(e);
    if (!elementsRawData) {
      return;
    }

    this._pasteShapesAndNotes(elementsRawData);
  };

  private async _pasteInTextNote(e: ClipboardEvent) {
    const blocks = await clipboardData2Blocks(this._page, e.clipboardData);
    if (!blocks.length) {
      return;
    }
    this._page.captureSync();

    deleteModelsByRange(this._page);

    const range = getCurrentBlockRange(this._page);

    const focusedBlockModel = range?.models[0];
    assertExists(focusedBlockModel);
    const service = getService(focusedBlockModel.flavour);
    assertExists(range);
    await service.json2Block(focusedBlockModel, blocks, range);
  }

  private _createPhasorElements(elements: Record<string, unknown>[]) {
    const phasorElements =
      (elements
        ?.map(d => {
          const id = this.surface.addElement(
            d.type as keyof PhasorElementType,
            d
          );
          const element = this.surface.pickById(id);
          return element;
        })
        .filter(e => !!e) as PhasorElement[]) || [];
    return phasorElements;
  }

  private async _createNoteBlocks(
    notes: SerializedBlock[],
    pasteX: number,
    pasteY: number,
    oldCommonBound: Bound
  ) {
    const noteIds = await Promise.all(
      notes.map(async ({ xywh, children, background }) => {
        const [oldX, oldY, oldW, oldH] = xywh
          ? deserializeXYWH(xywh)
          : [
              oldCommonBound.x,
              oldCommonBound.y,
              DEFAULT_NOTE_WIDTH,
              DEFAULT_NOTE_HEIGHT,
            ];
        const newXywh = serializeXYWH(
          pasteX + oldX - oldCommonBound.x,
          pasteY + oldY - oldCommonBound.y,
          oldW,
          oldH
        );
        const noteId = this._page.addBlock(
          'affine:note',
          {
            xywh: newXywh,
            background,
          },
          this._page.root?.id
        );
        const note = this._page.getBlockById(noteId);
        assertExists(note);

        await addSerializedBlocks(this._page, children, note, 0);
        return noteId;
      })
    );
    return noteIds;
  }

  private _getOldCommonBound(
    phasorElements: PhasorElement[],
    notes: SerializedBlock[]
  ) {
    const commonBound = getCommonBound([
      ...phasorElements,
      ...(notes
        .map(({ xywh }) => {
          if (!xywh) {
            return;
          }
          const [x, y, w, h] = deserializeXYWH(xywh);
          return {
            x,
            y,
            w,
            h,
          };
        })
        .filter(b => !!b) as Bound[]),
    ]);
    assertExists(commonBound);
    return commonBound;
  }

  private _emitSelectionChangeAfterPaste(
    phasorElementIds: string[],
    noteIds: string[]
  ) {
    const newSelected = [
      ...(phasorElementIds
        .map(id => this.surface.pickById(id))
        .filter(e => !!e) as PhasorElement[]),
      ...(noteIds
        .map(id => this._page.getBlockById(id))
        .filter(
          f => !!f && f.flavour === 'affine:note'
        ) as TopLevelBlockModel[]),
    ];

    this.slots.selectionUpdated.emit({
      active: false,
      selected: newSelected,
    });
  }

  private async _pasteShapesAndNotes(
    elementsRawData: Record<string, unknown>[]
  ) {
    const groupedByType = groupBy(elementsRawData, data =>
      isTopLevelBlock(data as unknown as Selectable) ? 'notes' : 'elements'
    ) as unknown as {
      notes?: SerializedBlock[];
      elements?: { type: PhasorElement['type'] }[];
    };

    const elements = this._createPhasorElements(groupedByType.elements || []);

    const oldCommonBound = this._getOldCommonBound(
      elements,
      groupedByType.notes || []
    );

    const { lastMousePos } = this.selection;
    const [modelX, modelY] = this.surface.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    // update phasor elements' position to mouse position
    elements.forEach(ele => {
      const newXYWH = serializeXYWH(
        pasteX + ele.x - oldCommonBound.x,
        pasteY + ele.y - oldCommonBound.y,
        ele.w,
        ele.h
      );

      this.surface.updateElement(ele.id, {
        xywh: newXYWH,
      });
    });
    // create and add blocks to page
    const noteIds = await this._createNoteBlocks(
      groupedByType.notes || [],
      pasteX,
      pasteY,
      oldCommonBound
    );

    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      noteIds
    );
  }
}
