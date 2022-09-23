import * as Y from 'yjs';
import { Slot } from './utils/slot';
import { TextAdapter } from './text-adapter';
import Quill from 'quill';
import { SelectionRange, AwarenessAdapter } from './awareness';
import { syncBlockProps, toBlockProps } from './utils/utils';
import { BaseBlockModel } from './base';
import { DebugProvider } from './providers';

export type YBlock = Y.Map<unknown>;
export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockProps = Record<string, any> & {
  id: string;
  flavour: string;
};

export type PrefixedBlockProps = Record<string, unknown> & {
  'sys:id': string;
  'sys:flavour': string;
};

export interface SerializedStore {
  blocks: {
    [key: string]: PrefixedBlockProps;
  };
}

export interface StackItem {
  meta: Map<'cursor-location', SelectionRange | undefined>;
  type: 'undo' | 'redo';
}

const IS_WEB = !import.meta.env.SSR;

// TODO use cached parent map
function getParent(
  root: BaseBlockModel | null,
  target: BaseBlockModel
): BaseBlockModel | null {
  if (!root || root.id === target.id) return null;
  if (root.children.includes(target)) return root;

  for (const child of root.children) {
    const parent = getParent(child, target);
    if (parent !== null) return parent;
  }
  return null;
}

export class Store {
  readonly doc = new Y.Doc();
  readonly provider!: DebugProvider;
  readonly awareness!: AwarenessAdapter;
  readonly textAdapters = new Map<string, TextAdapter>();

  readonly slots = {
    historyUpdated: new Slot(),
    blockAdded: new Slot<BaseBlockModel>(),
    blockDeleted: new Slot<string>(),
    textUpdated: new Slot<Y.YTextEvent>(),
    childrenUpdated: new Slot<BaseBlockModel>(),
    updated: new Slot(),
  };

  private _i = 0;
  private _history: Y.UndoManager;
  private _root: BaseBlockModel | null = null;
  private _flavourMap = new Map<string, typeof BaseBlockModel>();
  private _blockMap = new Map<string, BaseBlockModel>();

  constructor(room = '') {
    if (IS_WEB) {
      this.provider = new DebugProvider(room, this.doc);
      this.awareness = new AwarenessAdapter(this);
    }

    this._yBlocks.observeDeep(this._yBlocksObserver);

    this._history = new Y.UndoManager([this._yBlocks], {
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
    });

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyAddObserver);
    this._history.on('stack-item-popped', this._historyPopObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  /** key-value store of blocks */
  private get _yBlocks() {
    return this.doc.getMap('blocks') as YBlocks;
  }

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get canUndo() {
    return this._history.canUndo();
  }

  get canRedo() {
    return this._history.canRedo();
  }

  undo() {
    this._history.undo();
  }

  redo() {
    this._history.redo();
  }

  /** capture current operations to undo stack synchronously */
  captureSync() {
    this._history.stopCapturing();
  }

  resetHistory() {
    this._history.clear();
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }

  register(blockMap: Record<string, typeof BaseBlockModel>) {
    Object.keys(blockMap).forEach(key => {
      this._flavourMap.set(key, blockMap[key]);
    });
    return this;
  }

  getParent(block: BaseBlockModel) {
    return getParent(this._root, block);
  }

  getPreviousSibling(block: BaseBlockModel) {
    const parent = getParent(this._root, block);
    const index = parent?.children.indexOf(block) ?? -1;
    return parent?.children[index - 1] ?? null;
  }

  addBlock<T extends Partial<BlockProps>>(
    blockProps: T,
    parent?: BaseBlockModel,
    parentIndex?: number
  ) {
    if (!blockProps.flavour) {
      throw new Error('Block props must contain flavour');
    }

    const clonedProps = { ...blockProps };
    // prevent the store field being synced
    delete clonedProps.store;
    const id = clonedProps.id ? clonedProps.id : this._createId();
    clonedProps.id = id;

    const yBlock = new Y.Map() as YBlock;
    syncBlockProps(yBlock, clonedProps);

    this.transact(() => {
      const parentId = parent?.id ?? this._root?.id;

      if (parentId) {
        const yParent = this._yBlocks.get(parentId) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;
        const index = parentIndex ?? yChildren.length;
        yChildren.insert(index, [id]);
      }

      this._yBlocks.set(id, yBlock);
    });
    return id;
  }

  deleteBlockById(id: string) {
    const model = this._blockMap.get(id) as BaseBlockModel;
    this.deleteBlock(model);
  }

  deleteBlock(model: BaseBlockModel) {
    const parent = getParent(this._root, model);
    const index = parent?.children.indexOf(model) ?? -1;
    if (index > -1) {
      parent?.children.splice(parent.children.indexOf(model), 1);
    }

    this.transact(() => {
      this._yBlocks.delete(model.id);

      if (parent) {
        const yParent = this._yBlocks.get(parent.id) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;

        if (index > -1) {
          yChildren.delete(index, 1);
        }
      }
    });
  }

  attachText(id: string, quill: Quill) {
    const yBlock = this._getYBlock(id);

    const isVoidText = yBlock.get('prop:text') === undefined;
    const yText = isVoidText
      ? new Y.Text()
      : (yBlock.get('prop:text') as Y.Text);

    if (isVoidText) {
      this.transact(() => yBlock.set('prop:text', yText));
    }

    const adapter = new TextAdapter(this, yText, quill);
    this.textAdapters.set(id, adapter);

    quill.on('selection-change', () => {
      const cursor = adapter.getCursor();
      if (!cursor) {
        return;
      }
      this.awareness.setLocalCursor({ ...cursor, id });
    });
  }

  detachText(id: string) {
    this.textAdapters.delete(id);
  }

  private _createId(): string {
    return (this._i++).toString();
  }

  private _getYBlock(id: string): YBlock {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      throw new Error(`Block with id ${id} does not exist`);
    }
    return yBlock;
  }

  private _historyAddObserver = (event: { stackItem: StackItem }) => {
    if (IS_WEB) {
      event.stackItem.meta.set(
        'cursor-location',
        this.awareness.getLocalCursor()
      );
    }

    this._historyObserver();
  };

  private _historyPopObserver = (event: { stackItem: StackItem }) => {
    const cursor = event.stackItem.meta.get('cursor-location');
    if (!cursor) {
      return;
    }

    this.awareness.setLocalCursor(cursor);
    this._historyObserver();
  };

  private _historyObserver = () => {
    this.slots.historyUpdated.emit();
  };

  private _createBlockModel(props: Omit<BlockProps, 'children'>) {
    const BlockModelCtor = this._flavourMap.get(props.flavour);
    if (!BlockModelCtor) {
      throw new Error(`Block flavour ${props.flavour} is not registered`);
    }
    const blockModel = new BlockModelCtor(this, props);
    return blockModel;
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target === this._yBlocks) {
      event.keys.forEach((value, id) => {
        if (value.action === 'add') {
          const yBlock = this._getYBlock(id);
          const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;
          const props = toBlockProps(prefixedProps) as BlockProps;
          const model = this._createBlockModel(props);

          const isRoot = this._blockMap.size === 0;
          if (isRoot) {
            this._root = model;
          }

          this._blockMap.set(id, model);
          this.slots.blockAdded.emit(model);
        } else if (value.action === 'delete') {
          this._blockMap.delete(id);
          this.slots.blockDeleted.emit(id);
        } else {
          // fires when undoing delete-and-add operation on a block
          // console.warn('update action on top-level block store', event);
        }
      });
    }
    // event on single block
    else if (event.target.parent === this._yBlocks) {
      if (event instanceof Y.YTextEvent) {
        this.slots.textUpdated.emit(event);
      }
    }
    // event on block field
    else if (
      event.target.parent instanceof Y.Map &&
      event.target.parent.has('sys:id')
    ) {
      if (event instanceof Y.YArrayEvent) {
        const id = event.target.parent.get('sys:id') as string;
        const model = this._blockMap.get(id);
        if (!model) {
          throw new Error(`Block with id ${id} does not exist`);
        }

        const key = event.path[event.path.length - 1];
        if (key === 'sys:children') {
          const childIds = event.target.toArray();
          // XXX ensure children exists
          queueMicrotask(() => {
            model.children = childIds.map(
              id => this._blockMap.get(id) as BaseBlockModel
            );
            this.slots.childrenUpdated.emit(model);
          });
        }
      }
    }
  }

  private _yBlocksObserver = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
    this.slots.updated.emit();
  };
}
