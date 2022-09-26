import { PageContainer } from '../..';
import { BLOCK_ID_ATTR, Point, Rect, SelectPosition } from '@blocksuite/shared';
import { BaseBlockModel, IDisposable, Slot } from '@blocksuite/store';

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
  private _page: PageContainer;
  private _disposables: IDisposable[] = [];
  private _blockSelectSlotMap: { [k in string]: Slot<boolean> } = {};
  private _blockActiveSlotMap: { [k in string]: Slot<SelectPosition> } = {};
  private _anchorBlockId = '';
  private _focusBlockId = '';
  private _slots = {
    selection: new Slot<SelectionInfo>(),
  };
  private _lastCursorPosition: Point | null = null;

  constructor(page: PageContainer) {
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

  public calcIntersectBlocks(selectionRect: Rect, blockModel: BaseBlockModel) {
    let selectedBlocks: Array<string> = [];
    const blockDom = this._page.querySelector(
      `[${BLOCK_ID_ATTR}='${blockModel.id}']`
    );
    if (blockDom) {
      if (selectionRect.isIntersect(Rect.fromDom(blockDom))) {
        const { children } = blockModel;
        const queryStr = children.reduce((query, child, index) => {
          return `${query}${index ? ',' : ''}[${BLOCK_ID_ATTR}='${child.id}']`;
        }, '');
        // IMP: if parent block does not contain child block, this will be not useful
        const childrenDoms = blockDom.querySelectorAll(queryStr);
        childrenDoms.forEach(dom => {
          if (selectionRect.isIntersect(Rect.fromDom(dom))) {
            const id = dom.attributes.getNamedItem(BLOCK_ID_ATTR)?.value;
            id && selectedBlocks.push(id);
          }
        });
        // if selected only one block check if select children
        if (selectedBlocks.length === 1) {
          const selectedBlockModel = children.find(
            children => children.id === selectedBlocks[0]
          );
          if (selectedBlockModel && selectedBlockModel.children.length) {
            const selectedChildren = this.calcIntersectBlocks(
              selectionRect,
              selectedBlockModel
            );
            if (selectedChildren.length) {
              selectedBlocks = selectedChildren;
            }
          }
        }
      }
    }
    // only page model need call selection change
    if (this._page.model === blockModel) {
      this.selectedBlockIds = selectedBlocks;
    }
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

  private _getBlockActiveSlot(blockId: string) {
    let slot = this._blockActiveSlotMap[blockId];
    if (!slot) {
      slot = new Slot();
      this._blockActiveSlotMap[blockId] = slot;
    }
    return slot;
  }

  public addChangeListener(
    blockId: string,
    handler: (selected: boolean) => void
  ) {
    const slot = this._getBlockSelectSlot(blockId);
    const disposable = slot.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  public removeChangeListener(blockId: string) {
    const slot = this._blockSelectSlotMap[blockId];
    if (slot) {
      slot.dispose();
    }
    return delete this._blockSelectSlotMap[blockId];
  }

  private _emitBlockSelectChange(blockId: string, selected = true) {
    const slot = this._blockSelectSlotMap[blockId];
    if (slot) {
      slot.emit(selected);
    }
  }

  public onSelectionChange(cb: (selectionInfo: SelectionInfo) => void) {
    return this._slots.selection.on(cb);
  }

  private _emitSelectionChange() {
    this._slots.selection.emit(this.selectionInfo);
  }

  private _getPerviousBlock(blockId: string) {
    // TODO: resolve type problem
    const currentBlock = this._page.querySelector<'paragraph-block-element'>(
      `[${BLOCK_ID_ATTR}='${blockId}']` as unknown as 'paragraph-block-element'
    );
    if (currentBlock) {
      const parentBlock =
        currentBlock.parentElement?.closest<'paragraph-block-element'>(
          `[${BLOCK_ID_ATTR}]` as unknown as 'paragraph-block-element'
        );
      if (parentBlock) {
        const siblings = parentBlock.model.children;
        const index = siblings.findIndex(block => block.id === blockId);
        if (index > 0) {
          const previousBlock = siblings[index - 1];
          if (previousBlock) {
            if (previousBlock.children.length) {
              let firstChildren =
                previousBlock.children[previousBlock.children.length - 1];
              while (firstChildren.children.length) {
                firstChildren =
                  firstChildren.children[firstChildren.children.length - 1];
              }
              return firstChildren;
            }
            return previousBlock;
          }
        }
        return parentBlock.model;
      }
    }
    return null;
  }

  private _getNextBlock(blockId: string) {
    // TODO: resolve type problem
    let currentBlock = this._page.querySelector<'paragraph-block-element'>(
      `[${BLOCK_ID_ATTR}='${blockId}']` as unknown as 'paragraph-block-element'
    );
    if (currentBlock?.model.children.length) {
      return currentBlock.model.children[0];
    }
    while (currentBlock) {
      const parentBlock =
        currentBlock.parentElement?.closest<'paragraph-block-element'>(
          `[${BLOCK_ID_ATTR}]` as unknown as 'paragraph-block-element'
        ) || null;
      if (parentBlock) {
        const siblings = parentBlock.model.children;
        const index = siblings.findIndex(
          block => block.id === currentBlock?.model.id
        );
        if (index < siblings.length - 1) {
          return siblings[index + 1];
        }
      }
      currentBlock = parentBlock;
    }
    return null;
  }

  public activePreviousBlock(blockId: string, position?: SelectPosition) {
    let nextPosition = position;
    if (nextPosition) {
      if (nextPosition instanceof Point) {
        this._lastCursorPosition = nextPosition;
      } else {
        this._lastCursorPosition = null;
      }
    } else if (this._lastCursorPosition) {
      nextPosition = this._lastCursorPosition;
    }
    const preNodeModel = this._getPerviousBlock(blockId);
    if (preNodeModel) {
      this.activeBlockById(preNodeModel.id, nextPosition);
    }
  }

  public activeNextBlock(blockId: string, position: SelectPosition = 'start') {
    let nextPosition = position;
    if (nextPosition) {
      if (nextPosition instanceof Point) {
        this._lastCursorPosition = nextPosition;
      } else {
        this._lastCursorPosition = null;
      }
    } else if (this._lastCursorPosition) {
      nextPosition = this._lastCursorPosition;
    }
    const nextNodeModel = this._getNextBlock(blockId);
    if (nextNodeModel) {
      this.activeBlockById(nextNodeModel.id, nextPosition);
    }
  }

  public onBlockActive(
    blockId: string,
    cb: (position: SelectPosition) => void
  ) {
    const slot = this._getBlockActiveSlot(blockId);
    const disposable = slot.on(cb);
    this._disposables.push(disposable);
    return disposable;
  }

  public offBlockActive(blockId: string) {
    const slot = this._blockActiveSlotMap[blockId];
    if (slot) {
      slot.dispose();
    }
    return delete this._blockActiveSlotMap[blockId];
  }

  public activeBlockById(blockId: string, position: SelectPosition = 'start') {
    const slot = this._blockActiveSlotMap[blockId];
    if (slot) {
      slot.emit(position);
    }
  }

  public dispose() {
    this._disposables.forEach(disposable => disposable.dispose());
    window.removeEventListener('selectionchange', this._handlerBrowserChange);
    Object.values(this._blockSelectSlotMap).forEach(slot => slot.dispose());
    Object.values(this._slots).forEach(slot => slot.dispose());
  }
}
