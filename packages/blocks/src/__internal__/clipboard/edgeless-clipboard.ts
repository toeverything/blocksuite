import type { Bound, PhasorElement } from '@blocksuite/phasor';
import {
  deserializeXYWH,
  ElementCtors,
  generateElementId,
  getCommonBound,
  serializeXYWH,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import type { Selectable } from '../../page-block/edgeless/selection-manager.js';
import {
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_FRAME_WIDTH,
  isTopLevelBlock,
} from '../../page-block/edgeless/utils.js';
import { deleteModelsByRange } from '../../page-block/utils/container-operations.js';
import type { SerializedBlock, TopLevelBlockModel } from '../index.js';
import { getService } from '../service.js';
import { addSerializedBlocks } from '../service/json2block.js';
import { getCurrentBlockRange } from '../utils/block-range.js';
import { groupBy } from '../utils/std.js';
import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import {
  CLIPBOARD_MIMETYPE,
  clipboardData2Blocks,
  copy,
  getBlockClipboardInfo,
  performNativeCopy,
} from './utils.js';

function serialize(data: object) {
  return JSON.stringify(data);
}

function deserialize(data: string) {
  return JSON.parse(data);
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

  public dispose() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _onCut = (e: ClipboardEvent) => {
    e.preventDefault();
    this._onCopy(e);

    const selection = this._edgeless.getSelection().blockSelectionState;
    if (selection.active) {
      deleteModelsByRange(this._page);
      return;
    }

    this._page.transact(() => {
      selection.selected.forEach(selected => {
        if (isTopLevelBlock(selected)) {
          this._page.deleteBlock(selected);
        } else {
          this._edgeless.surface.removeElement(selected.id);
        }
      });
    });
    this._edgeless.slots.selectionUpdated.emit({ active: false, selected: [] });
  };

  private _onCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    const selection = this._edgeless.getSelection().blockSelectionState;
    // when frame active, handle copy like page mode
    if (selection.active) {
      const range = getCurrentBlockRange(this._page);
      assertExists(range);
      copy(range);
      return;
    }
    const data = selection.selected
      .map(selected => {
        if (isTopLevelBlock(selected)) {
          return getBlockClipboardInfo(selected).json;
        } else {
          return selected.serialize();
        }
      })
      .filter(d => !!d);
    const custom = new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE,
      serialize(data)
    );
    performNativeCopy([custom]);
  };

  private _onPaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    const selection = this._edgeless.getSelection().blockSelectionState;
    if (selection.active) {
      const blocks = await clipboardData2Blocks(this._page, e.clipboardData);
      if (!blocks.length) {
        return;
      }
      this._page.captureSync();

      await deleteModelsByRange(this._page);

      const range = getCurrentBlockRange(this._page);

      const focusedBlockModel = range?.models[0];
      assertExists(focusedBlockModel);
      const service = getService(focusedBlockModel.flavour);
      assertExists(range);
      await service.json2Block(focusedBlockModel, blocks, range);

      return;
    }
    const custom = e.clipboardData?.getData(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE
    );
    if (!custom) {
      return;
    }

    const elementsRawData = deserialize(custom) as Selectable[];

    const groupedByType = groupBy(elementsRawData, data =>
      isTopLevelBlock(data) ? 'frames' : 'elements'
    ) as unknown as {
      frames?: SerializedBlock[];
      elements?: { type: PhasorElement['type'] }[];
    };

    const elements =
      (groupedByType.elements
        ?.map(d => {
          const type = (d as PhasorElement).type;
          const element = ElementCtors[type]?.deserialize(d);
          element.id = generateElementId();
          return element;
        })
        .filter(e => !!e) as PhasorElement[]) || [];

    const commonBound = getCommonBound([
      ...elements,
      ...(groupedByType.frames
        ?.map(({ xywh }) => {
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

    const lastMousePos = this._edgeless.getSelection().lastMousePos;
    const [modelX, modelY] = this._edgeless.surface.toModelCoord(
      lastMousePos.x,
      lastMousePos.y
    );
    const pasteX = modelX - commonBound.w / 2;
    const pasteY = modelY - commonBound.h / 2;
    elements.forEach(ele => {
      ele.x = pasteX + ele.x - commonBound.x;
      ele.y = pasteY + ele.y - commonBound.y;
    });

    this._edgeless.surface.addElements(elements);
    const frameIds = await Promise.all(
      (groupedByType.frames || []).map(async ({ xywh, children }) => {
        const [oldX, oldY, oldW, oldH] = xywh
          ? deserializeXYWH(xywh)
          : [
              commonBound.x,
              commonBound.y,
              DEFAULT_FRAME_WIDTH,
              DEFAULT_FRAME_HEIGHT,
            ];
        const newXywh = serializeXYWH(
          pasteX + oldX - commonBound.x,
          pasteY + oldY - commonBound.y,
          oldW,
          oldH
        );
        const frameId = this._page.addBlock(
          'affine:frame',
          {
            xywh: newXywh,
          },
          this._page.root?.id
        );
        const frame = this._page.getBlockById(frameId);
        assertExists(frame);

        await addSerializedBlocks(this._page, children, frame, 0);
        return frameId;
      })
    );

    const newSelected = [
      ...(elements
        .map(ele => this._edgeless.surface.pickById(ele.id))
        .filter(e => !!e) as PhasorElement[]),
      ...(frameIds
        .map(id => this._page.getBlockById(id))
        .filter(f => !!f) as TopLevelBlockModel[]),
    ];

    this._edgeless.slots.selectionUpdated.emit({
      active: false,
      selected: newSelected,
    });
  };
}
