import type { PhasorElement } from '@blocksuite/phasor';
import { ElementCtors, generateElementId } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';

import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { isTopLevelBlock } from '../../page-block/edgeless/utils.js';
import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import { CLIPBOARD_MIMETYPE, performNativeCopy } from './utils.js';

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
    const selection = this._edgeless.getSelection().blockSelectionState;
    const data = selection.selected
      .map(selected => {
        if (isTopLevelBlock(selected)) {
          // TODO:
          return '';
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

    this._page.transact(() => {
      selection.selected.forEach(selected => {
        if (isTopLevelBlock(selected)) {
          // TODO:
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
    const data = selection.selected
      .map(selected => {
        if (isTopLevelBlock(selected)) {
          // TODO
          return '';
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

  private _onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const custom = e.clipboardData?.getData(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE
    );
    if (!custom) {
      return;
    }
    const elementsRawData = deserialize(custom) as {
      type: PhasorElement['type'];
    }[];
    const elements = elementsRawData
      .map(d => {
        const element = ElementCtors[d.type]?.deserialize(d);
        element.id = generateElementId();
        return element;
      })
      .filter(e => !!e) as PhasorElement[];
    this._edgeless.surface.addElements(elements);
  };
}
