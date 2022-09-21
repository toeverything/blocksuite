import { PaperContainer } from '../../components';
import { Rect } from '../../components/selection-rect/rect';
import { PageBlockModel } from '../../../../blocks/';
import { IDisposable, Slot } from '@building-blocks/store';
import { BLOCK_ID_ATTR } from '../../const';

export type SelectionInfo = InstanceType<
  typeof SelectionManager
>['selectionInfo'];

// TODO use lodash or move to utils
function without<T = unknown>(arr: Array<T>, ...values: Array<T>) {
  const toRemoveValues = Array.from(new Set(values));
  let result: Array<T> = arr;
  toRemoveValues.forEach(toRemoveValue => {
    result = result.filter(value => value !== toRemoveValue);
  });
  return result;
}

export class SelectionManager {
  private _selectedBlockIds: Array<string> = [];
  // @ts-ignore
  private _page: PaperContainer;
  private _disposables: IDisposable[] = [];
  private _blockSelectSlotMap: { [k in string]: Slot<boolean> } = {};
  private _anchorBlockId = '';
  private _focusBlockId = '';
  private _slots = {
    selection: new Slot<SelectionInfo>(),
  };

  constructor(page: PaperContainer) {
    this._page = page;
    this._handlerBrowserChange = this._handlerBrowserChange.bind(this);
    this._initListenBrowserSelection();
  }

  get selectedBlockIds() {
    return this._selectedBlockIds;
  }

  set selectedBlockIds(ids: Array<string>) {
    const blocksNeedUnselect = without<string>(this._selectedBlockIds, ...ids);
    const blocksNeedSelect = without<string>(ids, ...this._selectedBlockIds);
    blocksNeedUnselect.forEach(blockId => {
      this._emitBlockSelectChange(blockId, false);
    });
    blocksNeedSelect.forEach(blockId => {
      this._emitBlockSelectChange(blockId);
    });
    this._selectedBlockIds = ids;
    this._emitSelectionChange();
  }

  get type() {
    if (this._selectedBlockIds.length) {
      return 'Block';
    }
    const selection = window.getSelection();
    if (selection?.type === 'Caret' && this._anchorBlockId) {
      return 'Caret';
    }
    if (selection?.type === 'Range' && this._anchorBlockId) {
      return 'Range';
    }
    return 'None';
  }

  get selectionInfo() {
    if (this.type === 'Range' || this.type === 'Caret') {
      //TODO IMP: Do you need to pass Range and Crate directly here
      return {
        type: this.type,
        anchorBlockId: this._anchorBlockId,
        focusBlockId: this._focusBlockId,
      } as const;
    }
    if (this.type === 'Block') {
      return {
        type: 'Block',
        selectedNodesIds: this._selectedBlockIds,
      } as const;
    }
    return { type: 'None' } as const;
  }

  private _initListenBrowserSelection() {
    document.addEventListener('selectionchange', this._handlerBrowserChange);
  }

  private _handlerBrowserChange() {
    const selection = window.getSelection();
    this.selectedBlockIds = [];
    if (selection) {
      const { type, anchorNode, focusNode } = selection;
      if (
        type !== 'None' &&
        anchorNode &&
        focusNode &&
        this._page.contains(anchorNode) &&
        this._page.contains(focusNode)
      ) {
        const anchorBlockId =
          anchorNode.parentElement
            ?.closest(`[${BLOCK_ID_ATTR}]`)
            ?.getAttribute(BLOCK_ID_ATTR) || '';
        const focusBlockId =
          focusNode.parentElement
            ?.closest(`[${BLOCK_ID_ATTR}]`)
            ?.getAttribute(BLOCK_ID_ATTR) || '';
        this._anchorBlockId = anchorBlockId;
        this._focusBlockId = focusBlockId;
      }
    } else {
      this._anchorBlockId = '';
      this._focusBlockId = '';
    }
    this._emitSelectionChange();
  }

  public calcIntersectBlocks(selectionRect: Rect, blockModel: PageBlockModel) {
    const selectedBlocks: Array<string> = [];
    const blockDom = this._page.querySelector(
      `[${BLOCK_ID_ATTR}='${blockModel.id}']`
    );
    if (blockDom) {
      if (selectionRect.isIntersect(Rect.fromDom(blockDom))) {
        // TODO check if selectable, only page model has elements
        const children = blockModel.elements;
        const queryStr = children.reduce((query, child, index) => {
          return `${query}${index ? ',' : ''}[${BLOCK_ID_ATTR}='${child.id}']`;
        }, '');
        const childrenDoms = this._page.querySelectorAll(queryStr);
        childrenDoms.forEach(dom => {
          if (selectionRect.isIntersect(Rect.fromDom(dom))) {
            const id = dom.attributes.getNamedItem(BLOCK_ID_ATTR)?.value;
            id && selectedBlocks.push(id);
          }
        });
        if (selectedBlocks.length === 1) {
          // TODO run self
        }
      }
    }
    this.selectedBlockIds = selectedBlocks;
    return selectedBlocks;
  }

  private _getBlockSelectSlot(blockId: string) {
    let slot = this._blockSelectSlotMap[blockId];
    if (!slot) {
      slot = new Slot();
      this._blockSelectSlotMap[blockId] = slot;
    }
    return slot;
  }

  public onBlockSelectChange(
    blockId: string,
    cb: (isSelected: boolean) => void
  ) {
    const slot = this._getBlockSelectSlot(blockId);
    const disposables = slot.on(cb);
    this._disposables.push(slot.on(cb));
    return disposables;
  }

  public offBlockSelectChange(blockId: string) {
    const slot = this._blockSelectSlotMap[blockId];
    if (slot) {
      slot.dispose();
    }
    return delete this._blockSelectSlotMap[blockId];
  }

  private _emitBlockSelectChange(blockId: string, isSelected = true) {
    const slot = this._blockSelectSlotMap[blockId];
    if (slot) {
      slot.emit(isSelected);
    }
  }

  public onSelectionChange(cb: (selectionInfo: SelectionInfo) => void) {
    return this._slots.selection.on(cb);
  }

  private _emitSelectionChange() {
    this._slots.selection.emit(this.selectionInfo);
  }

  public dispose() {
    window.removeEventListener('selectionchange', this._handlerBrowserChange);
    Object.values(this._blockSelectSlotMap).forEach(slot => slot.dispose());
    Object.values(this._slots).forEach(slot => slot.dispose());
  }
}
