import {
  BLOCK_ID_ATTR,
  Rect,
  SelectedBlock,
  SelectionInfo,
  SelectionPosition,
  SelectionOptions,
  getParentBlockById,
  getPreviousSiblingById,
  getBlockById,
  getNextSiblingById,
} from '@blocksuite/shared';
import { BaseBlockModel, IDisposable, Slot, Store } from '@blocksuite/store';

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
  private _blockSelectSlotMap: {
    [k in string]: Slot<SelectionOptions | undefined>;
  } = {};
  private _anchorBlockId = '';
  private _focusBlockId = '';
  private _anchorBlockPosition: number | null = null;
  private _focusBlockPosition: number | null = null;
  private _slots = {
    selection: new Slot<SelectionInfo>(),
  };
  public lastSelectionPosition: SelectionPosition = 'start';
  private _selectionInfo: SelectionInfo = { type: 'None' };

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
    const blocksToUnselect = without<string>(this._selectedBlockIds, ...ids);
    const blocksToSelect = without<string>(ids, ...this._selectedBlockIds);
    this._selectedBlockIds = ids;
    this._updateSelectionInfo();
    this._emitSelectionChange();
    blocksToUnselect.forEach(blockId => {
      this._emitBlockSelectionChange(blockId);
    });
    blocksToSelect.forEach(blockId => {
      this._emitBlockSelectionChange(blockId);
    });
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
    return this._selectionInfo;
  }

  private _initListenBrowserSelection() {
    document.addEventListener('selectionchange', this._handlerBrowserChange);
  }

  private _handlerBrowserChange() {
    const selection = window.getSelection();

    if (selection) {
      const { type, anchorNode, focusNode } = selection;
      if (
        type !== 'None' &&
        anchorNode &&
        focusNode &&
        this._container.contains(anchorNode) &&
        this._container.contains(focusNode)
      ) {
        this.selectedBlockIds = [];
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
        // todo _anchorBlockPosition _focusBlockPosition when select page text
        const anchorSelection = this._store.richTextAdapters
          .get(anchorBlockId)
          ?.quill.getSelection();
        this._anchorBlockPosition = anchorSelection?.index ?? null;
        const focusSelection = this._store.richTextAdapters
          .get(focusBlockId)
          ?.quill.getSelection();
        this._focusBlockPosition = focusSelection
          ? focusSelection.index + focusSelection.length
          : null;
      }
    } else {
      this._anchorBlockId = '';
      this._focusBlockId = '';
      this._anchorBlockPosition = null;
      this._focusBlockPosition = null;
    }
    this._updateSelectionInfo();
    this._emitSelectionChange();
  }

  public calcIntersectBlocks(selectionRect: Rect, blockModel: BaseBlockModel) {
    let selectedBlocks: Array<string> = [];
    const selector = `[${BLOCK_ID_ATTR}='${blockModel.id}']`;
    const blockDom = this._container.querySelector(selector);

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

  public addBlockSelectedListener(
    blockId: string,
    handler: (selectionOptions?: SelectionOptions) => void
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
    delete this._blockSelectSlotMap[blockId];
  }

  private _emitBlockSelectionChange(
    blockId: string,
    selectionOptions?: SelectionOptions
  ) {
    const slot = this._blockSelectSlotMap[blockId];
    if (slot) {
      slot.emit(selectionOptions);
    }
  }

  public onSelectionChange(handler: (selectionInfo: SelectionInfo) => void) {
    return this._slots.selection.on(handler);
  }

  private _emitSelectionChange() {
    this._slots.selection.emit(this.selectionInfo);
  }

  private _getPreviousBlock(blockId: string) {
    // TODO: resolve type problem
    const parentBlock = getParentBlockById<'paragraph-block'>(
      blockId,
      this._container
    );
    if (parentBlock) {
      const previousBlock = getPreviousSiblingById<'paragraph-block'>(
        blockId,
        this._container
      );
      if (previousBlock?.model) {
        if (previousBlock.model.children.length) {
          let firstChildren =
            previousBlock.model.children[previousBlock.children.length - 1];
          while (firstChildren.children.length) {
            firstChildren =
              firstChildren.children[firstChildren.children.length - 1];
          }
          return firstChildren;
        }
        return previousBlock.model;
      }
      return parentBlock.model;
    }
    return null;
  }

  private _getNextBlock(blockId: string) {
    // TODO: resolve type problem
    let currentBlock = getBlockById<'paragraph-block'>(blockId);
    if (currentBlock?.model.children.length) {
      return currentBlock.model.children[0];
    }
    while (currentBlock) {
      const parentBlock = getParentBlockById<'paragraph-block'>(
        currentBlock.model.id
      );
      if (parentBlock) {
        const nextSiblings = getNextSiblingById<'paragraph-block'>(
          currentBlock.model.id
        );
        if (nextSiblings) {
          return nextSiblings.model;
        }
      }
      currentBlock = parentBlock;
    }
    return null;
  }

  private _toSelectedBlock(blockId: string): SelectedBlock {
    const block = this._store.getBlockById(blockId);
    if (!block) {
      throw new Error(`block ${blockId} not found`);
    }

    return {
      id: block.id,
      children: block.children.map(child => this._toSelectedBlock(child.id)),
    };
  }

  private _collectSelectedBlocks(): SelectedBlock[] {
    return this._selectedBlockIds.map(id => this._toSelectedBlock(id));
  }

  private _updateSelectionInfo() {
    if (this.type === 'Range') {
      this._selectionInfo = {
        type: this.type,
        anchorBlockId: this._anchorBlockId,
        focusBlockId: this._focusBlockId,
        anchorBlockPosition: this._anchorBlockPosition,
        focusBlockPosition: this._focusBlockPosition,
      };
    } else if (this.type === 'Caret') {
      this._selectionInfo = {
        type: this.type,
        anchorBlockId: this._anchorBlockId,
        focusBlockId: this._focusBlockId,
        anchorBlockPosition: this._anchorBlockPosition,
        focusBlockPosition: this._focusBlockPosition,
      };
    } else if (this.type === 'Block') {
      this._selectionInfo = {
        type: this.type,
        blocks: this._collectSelectedBlocks(),
      };
    } else {
      this._selectionInfo = { type: 'None' };
    }
  }

  public activatePreviousBlock(blockId: string, position?: SelectionPosition) {
    let nextPosition = position;
    if (nextPosition) {
      this.lastSelectionPosition = nextPosition;
    } else if (this.lastSelectionPosition) {
      nextPosition = this.lastSelectionPosition;
    }
    const preNodeModel = this._getPreviousBlock(blockId);
    if (preNodeModel) {
      this._emitBlockSelectionChange(preNodeModel.id, {
        needFocus: true,
        from: 'next',
      });
    }
  }

  public activateNextBlock(
    blockId: string,
    position: SelectionPosition = 'start'
  ) {
    let nextPosition = position;
    if (nextPosition) {
      this.lastSelectionPosition = nextPosition;
    } else if (this.lastSelectionPosition) {
      nextPosition = this.lastSelectionPosition;
    }
    const nextNodeModel = this._getNextBlock(blockId);
    if (nextNodeModel) {
      this._emitBlockSelectionChange(nextNodeModel.id, {
        needFocus: true,
        from: 'previous',
      });
    }
  }

  public expandSelection(isPrevious = true) {
    if (this.type === 'Block') {
      let nextBlock = null;
      if (isPrevious) {
        nextBlock = getPreviousSiblingById<'paragraph-block'>(
          this.selectedBlockIds[0]
        );
      } else {
        nextBlock = getNextSiblingById<'paragraph-block'>(
          this.selectedBlockIds[0]
        );
      }
      if (nextBlock) {
        if (this.selectedBlockIds.includes(nextBlock.model.id)) {
          this.selectedBlockIds = this.selectedBlockIds.slice(1);
        } else {
          this.selectedBlockIds = [
            nextBlock.model.id,
            ...this.selectedBlockIds,
          ];
        }
      } else {
        const parentBlock = getParentBlockById<'paragraph-block'>(
          this.selectedBlockIds[0]
        );
        if (parentBlock && parentBlock.model.id !== this._store.root?.id) {
          this.selectedBlockIds = [parentBlock.model.id];
        }
      }
    }
  }

  public selectAllBlocks() {
    this.selectedBlockIds =
      this._store.root?.children.map(block => block.id) || [];
  }

  public dispose() {
    this._disposables.forEach(disposable => disposable.dispose());
    Object.values(this._blockSelectSlotMap).forEach(slot => slot.dispose());
    Object.values(this._slots).forEach(slot => slot.dispose());
    window.removeEventListener('selectionchange', this._handlerBrowserChange);
  }
}
