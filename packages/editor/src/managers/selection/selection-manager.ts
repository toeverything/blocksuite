import {
  BLOCK_ID_ATTR,
  Point,
  Rect,
  SelectionPosition,
} from '@blocksuite/shared';
import { BaseBlockModel, IDisposable, Slot, Store } from '@blocksuite/store';

export type SelectionState = InstanceType<
  typeof SelectionManager
>['selectionInfo'];

export interface SelectedBlock {
  blockId: string;
  startPos?: number;
  endPos?: number;
  children: SelectedBlock[];
}

export interface BlockSelectionInfo {
  type: 'Block';
  blocks: SelectedBlock[];
}

interface RangeSelectionInfo {
  type: 'Range';
}

interface NoneSelectionInfo {
  type: 'None';
}

interface CaretSelectionInfo {
  type: 'Caret';
}

export type SelectionInfo =
  | BlockSelectionInfo
  | RangeSelectionInfo
  | NoneSelectionInfo
  | CaretSelectionInfo;

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
  private _container: HTMLElement;
  private _store: Store;
  private _disposables: IDisposable[] = [];
  private _blockSelectSlotMap: { [k in string]: Slot<boolean> } = {};
  private _blockActiveSlotMap: { [k in string]: Slot<SelectionPosition> } = {};
  private _anchorBlockId = '';
  private _focusBlockId = '';
  private _anchorBlockPosition: number | null | undefined = null;
  private _focusBlockPosition: number | null | undefined = null;
  private _slots = {
    selection: new Slot<SelectionState>(),
  };
  private _lastCursorPosition: Point | null = null;

  constructor(container: HTMLElement, store: Store) {
    this._store = store;
    this._container = container;
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
        anchorBlockPosition: this._anchorBlockPosition,
        focusBlockPosition: this._focusBlockPosition,
      } as const;
    }
    if (this.type === 'Block') {
      return {
        type: 'Block',
        selectedNodeIds: this._selectedBlockIds,
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
        this._container.contains(anchorNode) &&
        this._container.contains(focusNode)
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
        const anchorSelection = this._store.richTextAdapters
          .get(anchorBlockId)
          ?.quill.getSelection();
        this._anchorBlockPosition = anchorSelection?.index;
        const focusSelection = this._store.richTextAdapters
          .get(focusBlockId)
          ?.quill.getSelection();
        this._focusBlockPosition =
          focusSelection && focusSelection.index + focusSelection.length;
      }
    } else {
      this._anchorBlockId = '';
      this._focusBlockId = '';
      this._anchorBlockPosition = null;
      this._focusBlockPosition = null;
    }
    this._emitSelectionChange();
  }

  public calcIntersectBlocks(selectionRect: Rect, blockModel: BaseBlockModel) {
    let selectedBlocks: Array<string> = [];
    const blockDom = this._container.querySelector(
      `[${BLOCK_ID_ATTR}='${blockModel.id}']`
    );
    if (blockDom) {
      if (selectionRect.isIntersect(Rect.fromDom(blockDom))) {
        const { children } = blockModel;
        const queryStr = children
          .map(child => `[${BLOCK_ID_ATTR}='${child.id}']`)
          .join(',');

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
    if (this._store.root === blockModel) {
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

  public addBlockSelectedListener(
    blockId: string,
    handler: (selected: boolean) => void
  ) {
    const slot = this._getBlockSelectSlot(blockId);
    const disposable = slot.on(handler);
    this._disposables.push(disposable);
    return disposable;
  }

  public removeBlockSelectedListener(blockId: string) {
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

  public onSelectionChange(cb: (selectionInfo: SelectionState) => void) {
    return this._slots.selection.on(cb);
  }

  private _emitSelectionChange() {
    this._slots.selection.emit(this.selectionInfo);
  }

  private _getPerviousBlock(blockId: string) {
    // TODO: resolve type problem
    const currentBlock = this._container.querySelector<'paragraph-block'>(
      `[${BLOCK_ID_ATTR}='${blockId}']` as unknown as 'paragraph-block'
    );
    if (currentBlock) {
      const parentBlock =
        currentBlock.parentElement?.closest<'paragraph-block'>(
          `[${BLOCK_ID_ATTR}]` as unknown as 'paragraph-block'
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
    let currentBlock = this._container.querySelector<'paragraph-block'>(
      `[${BLOCK_ID_ATTR}='${blockId}']` as unknown as 'paragraph-block'
    );
    if (currentBlock?.model.children.length) {
      return currentBlock.model.children[0];
    }
    while (currentBlock) {
      const parentBlock =
        currentBlock.parentElement?.closest<'paragraph-block'>(
          `[${BLOCK_ID_ATTR}]` as unknown as 'paragraph-block'
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

  public activePreviousBlock(blockId: string, position?: SelectionPosition) {
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

  public activeNextBlock(
    blockId: string,
    position: SelectionPosition = 'start'
  ) {
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

  public addBlockActiveListener(
    blockId: string,
    cb: (position: SelectionPosition) => void
  ) {
    const slot = this._getBlockActiveSlot(blockId);
    const disposable = slot.on(cb);
    this._disposables.push(disposable);
    return disposable;
  }

  public removeBlockActiveListener(blockId: string) {
    const slot = this._blockActiveSlotMap[blockId];
    if (slot) {
      slot.dispose();
    }
    return delete this._blockActiveSlotMap[blockId];
  }

  public activeBlockById(
    blockId: string,
    position: SelectionPosition = 'start'
  ) {
    const slot = this._blockActiveSlotMap[blockId];
    if (slot) {
      slot.emit(position);
    }
  }

  // TODO: does not consider discontinuous situations (such as multi-selection or hidden block scenarios), the product does not have this feature yet
  public getSelectionInfo(): SelectionInfo {
    const selectionInfo = this.selectionInfo;
    const startBlockId = this._getFirstBlockId(selectionInfo);
    const endBlockId = this._getLastBlockId(selectionInfo);
    let startPosition = null;
    let endPosition = null;
    if (selectionInfo.type === 'Range' || selectionInfo.type === 'Caret') {
      if (startBlockId === selectionInfo.anchorBlockId) {
        startPosition = selectionInfo.anchorBlockPosition;
        endPosition = selectionInfo.focusBlockPosition;
      } else {
        startPosition = selectionInfo.focusBlockPosition;
        endPosition = selectionInfo.anchorBlockPosition;
      }
    }
    let select: SelectionInfo = {
      type: 'None',
    };
    if (!startBlockId || !endBlockId) {
      return select;
    }

    const blocks: SelectedBlock[] = [];
    const blockId = startBlockId;
    let founded = false;
    let currentBlock = this._store.getBlockById(blockId);
    while (!founded && currentBlock) {
      founded = this._collectBlockInfo(
        currentBlock,
        startBlockId,
        endBlockId,
        startPosition,
        endPosition,
        blocks
      );
      if (founded) {
        break;
      }
      let parent: BaseBlockModel | null = currentBlock;
      currentBlock = null;
      while (parent) {
        const nextSibling = this._store.getNextSibling(parent);
        if (nextSibling) {
          currentBlock = nextSibling;
          break;
        }
        parent = this._store.getParent(parent);
      }
    }

    select = {
      type: selectionInfo.type,
      blocks: blocks,
    };
    return select;
  }

  private _collectBlockInfo(
    block: BaseBlockModel,
    startId: string,
    endId: string,
    startPosition: number | null | undefined,
    endPosition: number | null | undefined,
    blocks: SelectedBlock[]
  ): boolean {
    const selectedBlock: SelectedBlock = {
      blockId: block.id,
      children: [] as SelectedBlock[],
    };

    if (block.id === startId && startPosition) {
      selectedBlock.startPos = startPosition;
    }

    if (block.id === endId && endPosition) {
      selectedBlock.endPos = endPosition;
    }

    blocks.push(selectedBlock);

    let beenFindEnd = block.id === endId;
    if (!beenFindEnd) {
      for (let i = 0; i < block.children.length; i++) {
        const nextBlock = block.children[i];
        beenFindEnd = this._collectBlockInfo(
          nextBlock,
          startId,
          endId,
          startPosition,
          endPosition,
          selectedBlock.children
        );
        if (beenFindEnd) {
          break;
        }
      }
    }

    return beenFindEnd;
  }

  private _getFirstBlockId(selectionInfo: SelectionState) {
    let blockId = '';
    if (selectionInfo.type === 'Block') {
      if (selectionInfo.selectedNodeIds?.length === 0) {
        return blockId;
      }

      blockId = selectionInfo.selectedNodeIds[0];
      let previousBlockId = blockId;
      while (
        previousBlockId &&
        selectionInfo.selectedNodeIds.indexOf(previousBlockId) !== 0
      ) {
        blockId = previousBlockId;
        previousBlockId = this._getPerviousBlock(blockId)?.id || '';
      }
    } else if (
      selectionInfo.type === 'Range' ||
      selectionInfo.type === 'Caret'
    ) {
      blockId = selectionInfo.anchorBlockId;
      let previousBlockId = blockId;
      while (previousBlockId) {
        previousBlockId = this._getPerviousBlock(previousBlockId)?.id || '';
        if (previousBlockId === selectionInfo.focusBlockId) {
          blockId = previousBlockId;
          break;
        }
      }
    }
    return blockId && blockId !== '-1' ? blockId : '';
  }

  private _getLastBlockId(selectionInfo: SelectionState) {
    let blockId = '';
    if (selectionInfo.type === 'Block') {
      if (selectionInfo.selectedNodeIds?.length === 0) {
        return blockId;
      }

      blockId =
        selectionInfo.selectedNodeIds[selectionInfo.selectedNodeIds.length - 1];
      let nextBlockId = blockId;
      while (
        nextBlockId &&
        selectionInfo.selectedNodeIds.indexOf(nextBlockId) !== -1
      ) {
        blockId = nextBlockId;
        nextBlockId = this._getNextBlock(blockId)?.id || '';
      }

      let blockModel = this._store.getBlockById(blockId);
      while (blockModel) {
        blockId = blockModel.id;
        blockModel = blockModel.lastChild();
      }
    } else if (
      selectionInfo.type === 'Range' ||
      selectionInfo.type === 'Caret'
    ) {
      blockId = selectionInfo.focusBlockId;
      let nextBlockId = blockId;
      while (nextBlockId) {
        nextBlockId = this._getNextBlock(nextBlockId)?.id || '';
        if (nextBlockId === selectionInfo.anchorBlockId) {
          blockId = nextBlockId;
          break;
        }
      }
    }
    return blockId && blockId !== '-1' ? blockId : '';
  }

  public dispose() {
    this._disposables.forEach(disposable => disposable.dispose());
    window.removeEventListener('selectionchange', this._handlerBrowserChange);
    Object.values(this._blockSelectSlotMap).forEach(slot => slot.dispose());
    Object.values(this._slots).forEach(slot => slot.dispose());
  }
}
