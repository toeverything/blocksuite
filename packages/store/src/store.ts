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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockProps = Record<string, any> & {
  id: string;
  flavour: string;
  children: string[];
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
  stackItem: {
    meta: Map<'cursor-location', SelectionRange | undefined>;
    type: 'undo' | 'redo';
  };
}

const IS_WEB = !import.meta.env.SSR;

export class Store {
  readonly doc = new Y.Doc();
  readonly provider!: DebugProvider;
  readonly awareness!: AwarenessAdapter;
  readonly textAdapters = new Map<string, TextAdapter>();

  readonly slots = {
    update: new Slot(),
    historyUpdate: new Slot(),
    addBlock: new Slot<BaseBlockModel>(),
    deleteBlock: new Slot<string>(),
    updateText: new Slot<Y.YTextEvent>(),
  };

  private _i = 0;
  private _history: Y.UndoManager;
  private _currentRoot: BaseBlockModel | null = null;
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

  addBlock<T extends Partial<BlockProps>>(blockProps: T) {
    if (!blockProps.flavour) {
      throw new Error('Block props must contain flavour');
    }
    const id = this._createId();

    blockProps.id = id;

    const yBlock = new Y.Map() as YBlock;
    syncBlockProps(yBlock, blockProps);

    // no root when adding root itself
    const rootId = this._currentRoot?.id;
    if (rootId) {
      const yRoot = this._yBlocks.get(rootId) as YBlock;
      const yChildren = yRoot.get('sys:children') as Y.Array<string>;
      yChildren.insert(yChildren.length, [id]);
    }

    this.transact(() => {
      this._yBlocks.set(id, yBlock);
    });
    return id;
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

  setRoot(block: BaseBlockModel) {
    this._currentRoot = block;
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

  private _historyAddObserver = (event: StackItem) => {
    if (IS_WEB) {
      event.stackItem.meta.set(
        'cursor-location',
        this.awareness.getLocalCursor()
      );
    }

    this._historyObserver();
  };

  private _historyPopObserver = (event: StackItem) => {
    const cursor = event.stackItem.meta.get('cursor-location');
    if (!cursor) {
      return;
    }

    this.awareness.setLocalCursor(cursor);
    this._historyObserver();
  };

  private _historyObserver = () => {
    this.slots.historyUpdate.emit();
  };

  private _createBlockModel(props: BlockProps) {
    const BlockModelCtor = this._flavourMap.get(props.flavour);
    if (!BlockModelCtor) {
      throw new Error(`Block flavour ${props.flavour} is not registered`);
    }
    const blockModel = new BlockModelCtor(this, props);
    return blockModel;
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    if (event instanceof Y.YTextEvent) {
      this.slots.updateText.emit(event);
    } else if (event instanceof Y.YMapEvent) {
      if (event.target === this._yBlocks) {
        event.keys.forEach((value, id) => {
          if (value.action === 'add') {
            const yBlock = this._getYBlock(id);
            const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;
            const props = toBlockProps(prefixedProps) as BlockProps;
            const blockModel = this._createBlockModel(props);

            this._blockMap.set(id, blockModel);
            this.slots.addBlock.emit(blockModel);
          } else if (value.action === 'delete') {
            this._blockMap.delete(id);
            this.slots.deleteBlock.emit(id);
          } else {
            // console.trace('unsupported update action on blocks', event);
          }
        });
      } else if (event.target.parent === this._yBlocks) {
        // TODO update yBlock and blockModel
      }
    } else {
      // console.trace('unsupported event', event);
    }
  }

  private _yBlocksObserver = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
    this.slots.update.emit();
  };
}
