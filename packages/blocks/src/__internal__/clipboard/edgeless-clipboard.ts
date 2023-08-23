import { assertExists, groupBy } from '@blocksuite/global/utils';
import type { IBound } from '@blocksuite/phasor';
import {
  Bound,
  compare,
  type Connection,
  ConnectorElement,
  deserializeXYWH,
  getCommonBound,
  type PhasorElement,
  type PhasorElementType,
  serializeXYWH,
} from '@blocksuite/phasor';
import { type Page } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { Selectable } from '../../page-block/edgeless/services/tools-manager.js';
import { getCopyElements } from '../../page-block/edgeless/utils/clipboard-utils.js';
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_NOTE_WIDTH,
} from '../../page-block/edgeless/utils/consts.js';
import {
  isPhasorElementWithText,
  isTopLevelBlock,
} from '../../page-block/edgeless/utils/query.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';
import { ContentParser } from '../content-parser/index.js';
import {
  type Connectable,
  type SerializedBlock,
  type TopLevelBlockModel,
} from '../index.js';
import { getService } from '../service/index.js';
import { addSerializedBlocks } from '../service/json2block.js';
import type { Clipboard } from './type.js';
import {
  clipboardData2Blocks,
  copyBlocksInPage,
  copyOnPhasorElementWithText,
  getBlockClipboardInfo,
} from './utils/commons.js';
import {
  CLIPBOARD_MIMETYPE,
  createSurfaceClipboardItems,
  getSurfaceClipboardData,
  isPureFileInClipboard,
  performNativeCopy,
} from './utils/index.js';
import { deleteModelsByTextSelection } from './utils/operation.js';

function prepareConnectorClipboardData(
  connector: ConnectorElement,
  selected: Selectable[]
) {
  const sourceId = connector.source?.id;
  const targetId = connector.target?.id;
  const serialized = connector.serialize();
  if (sourceId && !selected.find(s => s.id === sourceId)) {
    serialized.source = { position: connector.absolutePath[0] };
  }
  if (targetId && !selected.find(s => s.id === targetId)) {
    serialized.target = {
      position: connector.absolutePath[connector.absolutePath.length - 1],
    };
  }
  return serialized;
}

async function prepareClipboardData(selectedAll: Selectable[]) {
  const selected = await Promise.all(
    selectedAll.map(async selected => {
      if (isTopLevelBlock(selected)) {
        return (await getBlockClipboardInfo(selected)).json;
      } else if (selected instanceof ConnectorElement) {
        return prepareConnectorClipboardData(selected, selectedAll);
      } else {
        return selected.serialize();
      }
    })
  );
  return selected.filter(d => !!d);
}

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

  get toolMgr() {
    return this._edgeless.tools;
  }

  get selection() {
    return this._edgeless.selectionManager;
  }

  get textSelection() {
    return this._edgeless.selection.find('text');
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
    e.preventDefault();
    this._onCopy(e);

    const { state } = this.selection;
    if (state.editing) {
      deleteModelsByTextSelection(this._edgeless);
      return;
    }

    this._page.transact(() => {
      state.elements.forEach(id => {
        const selectedModel = this._edgeless.getElementModel(id);
        if (!selectedModel) return;

        if (isTopLevelBlock(selectedModel)) {
          this._page.deleteBlock(selectedModel);
        } else {
          this._edgeless.connector.detachConnectors([
            selectedModel as Connectable,
          ]);
          this.surface.removeElement(id);
        }
      });
    });

    this.selection.setSelection({
      editing: false,
      elements: [],
    });
  };

  private _onCopy = async (e: ClipboardEvent) => {
    e.preventDefault();
    await this.copy();
  };

  async copy() {
    const { state } = this.selection;
    const elements = getCopyElements(this._edgeless, this.selection.elements);
    // when note active, handle copy like page mode
    if (state.editing) {
      if (isPhasorElementWithText(elements[0])) {
        copyOnPhasorElementWithText(this._edgeless);
      } else {
        await copyBlocksInPage(this._edgeless);
      }
      return;
    }
    const data = await prepareClipboardData(elements);

    const clipboardItems = createSurfaceClipboardItems(data);
    performNativeCopy(clipboardItems);
  }

  private _onPaste = async (e: ClipboardEvent) => {
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      return;
    }
    e.preventDefault();
    const { state, elements } = this.selection;
    if (state.editing) {
      if (!isPhasorElementWithText(elements[0])) {
        this._pasteInTextNote(e);
      }
      // use build-in paste handler in virgo when paste in surface text element
      return;
    }

    if (e.clipboardData && isPureFileInClipboard(e.clipboardData)) {
      const files = e.clipboardData.files;
      if (files.length === 0) {
        return;
      }
      const res: { file: File; sourceId: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image')) {
          const sourceId = await this._edgeless.page.blobs.set(file);
          res.push({ file, sourceId });
        }
      }
      await this._edgeless.addImages(res);
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

    deleteModelsByTextSelection(this._edgeless);

    const textSelection = this.textSelection;
    assertExists(textSelection);
    const selectedModels = getSelectedContentModels(this._edgeless, ['text']);

    const focusedBlockModel = selectedModels[0];
    assertExists(focusedBlockModel);
    const service = getService(focusedBlockModel.flavour);
    await service.json2Block(focusedBlockModel, blocks, textSelection.from);
  }

  private _createPhasorElement(clipboardData: Record<string, unknown>) {
    const id = this.surface.addElement(
      clipboardData.type as keyof PhasorElementType,
      clipboardData
    );
    const element = this.surface.pickById(id);
    assertExists(element);
    return element;
  }

  private _createPhasorElements(
    elements: Record<string, unknown>[],
    idMap: Map<string, string>
  ) {
    const result = groupBy(elements, item =>
      item.type === 'connector' ? 'connectors' : 'nonConnectors'
    );

    return [
      ...(result.nonConnectors
        ?.map(d => {
          const oldId = d.id as string;
          assertExists(oldId);
          const element = this._createPhasorElement(d);
          idMap.set(oldId, element.id);
          return element;
        })
        .filter(e => !!e) ?? []),

      ...(result.connectors?.map(connector => {
        const sourceId = (<Connection>connector.source).id;
        if (sourceId) {
          (<Connection>connector.source).id =
            idMap.get(sourceId) ?? (sourceId as string);
        }
        const targetId = (<Connection>connector.target).id;
        if (targetId) {
          (<Connection>connector.target).id =
            idMap.get(targetId) ?? (targetId as string);
        }
        return this._createPhasorElement(connector);
      }) ?? []),
    ];
  }

  private async _createNoteBlocks(
    notes: SerializedBlock[],
    pasteX: number,
    pasteY: number,
    oldCommonBound: Bound,
    oldToNewIdMap: Map<string, string>
  ) {
    const noteIds = await Promise.all(
      notes.map(async ({ id, xywh, children, background }) => {
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
        if (id) oldToNewIdMap.set(id, noteId);
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
    const commonBound = getCommonBound(
      [...phasorElements, ...notes]
        .map(({ xywh }) => {
          if (!xywh) {
            return;
          }
          const [x, y, w, h] =
            typeof xywh === 'string' ? deserializeXYWH(xywh) : xywh;

          return {
            x,
            y,
            w,
            h,
          };
        })
        .filter(b => !!b) as Bound[]
    );
    assertExists(commonBound);
    return commonBound;
  }

  private _emitSelectionChangeAfterPaste(
    phasorElementIds: string[],
    noteIds: string[]
  ) {
    const newSelected = [
      ...phasorElementIds,
      ...noteIds.filter(id => {
        return this._page.getBlockById(id)?.flavour === 'affine:note';
      }),
    ];

    this.selection.setSelection({
      editing: false,
      elements: newSelected,
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

    const oldCommonBound = this._getOldCommonBound(
      (groupedByType.elements ?? []) as PhasorElement[],
      groupedByType.notes || []
    );

    const { lastMousePos } = this.toolMgr;
    const [modelX, modelY] = this.surface.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );
    const pasteX = modelX - oldCommonBound.w / 2;
    const pasteY = modelY - oldCommonBound.h / 2;

    // map old id to new id to rebuild connector's source and target
    const oldIdToNewIdMap = new Map<string, string>();

    // create and add blocks to page
    const noteIds = await this._createNoteBlocks(
      groupedByType.notes || [],
      pasteX,
      pasteY,
      oldCommonBound,
      oldIdToNewIdMap
    );

    const elements = this._createPhasorElements(
      groupedByType.elements || [],
      oldIdToNewIdMap
    );

    // update phasor elements' position to mouse position
    elements.forEach(ele => {
      const newBound = new Bound(
        pasteX + ele.x - oldCommonBound.x,
        pasteY + ele.y - oldCommonBound.y,
        ele.w,
        ele.h
      );
      if (ele instanceof ConnectorElement) {
        this._edgeless.connector.updateXYWH(ele, newBound);
      } else {
        this.surface.updateElement(ele.id, {
          xywh: newBound.serialize(),
        });
      }
    });

    this._emitSelectionChangeAfterPaste(
      elements.map(ele => ele.id),
      noteIds
    );
  }

  async copyAsPng(notes: TopLevelBlockModel[], shapes: PhasorElement[]) {
    const notesLen = notes.length;
    const shapesLen = shapes.length;

    if (notesLen + shapesLen === 0) return;

    // sort by `index`
    notes.sort(compare);
    shapes.sort(compare);

    const bounds: IBound[] = [];
    notes.forEach(note => {
      bounds.push(Bound.deserialize(note.xywh));
    });
    shapes.forEach(shape => {
      bounds.push(Bound.deserialize(shape.xywh));
    });
    const bound = getCommonBound(bounds);
    if (!bound) {
      return;
    }

    const parser = new ContentParser(this._page);
    const canvas = await parser.edgelessToCanvas(
      this._edgeless,
      bound,
      notes,
      shapes
    );

    assertExists(canvas);

    // @ts-ignore
    if (window.apis?.clipboard?.copyAsImageFromString) {
      // @ts-ignore
      await window.apis.clipboard?.copyAsImageFromString(
        canvas.toDataURL(CLIPBOARD_MIMETYPE.IMAGE_PNG)
      );
    } else {
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject('Canvas can not export blob')),
          CLIPBOARD_MIMETYPE.IMAGE_PNG
        )
      );
      assertExists(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    }
  }
}
