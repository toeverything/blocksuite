import * as Y from 'yjs';
import { WebrtcProvider as DebugProvider } from 'y-webrtc';
import { Slot } from './utils/slot';
import { TextAdapter } from './text-adapter';
import Quill from 'quill';
import { SelectionRange, AwarenessAdapter } from './awareness';
import { syncBlockProps, toBlockProps } from './utils/utils';

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
    meta: Map<'cursor-location', SelectionRange>;
    type: 'undo' | 'redo';
  };
}

let i = 0;
let created = false;

export class Store {
  readonly doc = new Y.Doc();
  readonly provider: DebugProvider;
  private _history: Y.UndoManager;
  readonly awareness: AwarenessAdapter;

  readonly slots = {
    update: new Slot(),
    historyUpdate: new Slot(),
    addBlock: new Slot<BlockProps>(),
    deleteBlock: new Slot<string>(),
    updateText: new Slot<Y.YTextEvent>(),
  };

  readonly textAdapters = new Map<string, TextAdapter>();

  constructor(room: string) {
    if (created) {
      throw new Error('Store should only be created once');
    }
    created = true;

    this.provider = new DebugProvider(room, this.doc);
    this._yBlocks.observeDeep(this._yBlocksObserver);

    this._history = new Y.UndoManager([this._yBlocks], {
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
    });

    this.awareness = new AwarenessAdapter(this);

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyAddObserver);
    this._history.on('stack-item-popped', this._historyPopObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  private _historyAddObserver = (event: StackItem) => {
    event.stackItem.meta.set(
      'cursor-location',
      this.awareness.getLocalCursor()
    );
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

  private _yBlocksObserver = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      if (event instanceof Y.YTextEvent) {
        this.slots.updateText.emit(event);
      } else if (event instanceof Y.YMapEvent) {
        if (event.target === this._yBlocks) {
          event.keys.forEach((value, id) => {
            if (value.action === 'add') {
              const yBlock = this._getYBlock(id);
              const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;
              const props = toBlockProps(prefixedProps) as BlockProps;
              this.slots.addBlock.emit(props);
            } else if (value.action === 'delete') {
              this.slots.deleteBlock.emit(id);
            } else {
              console.warn('Unknown update action on blocks', event);
            }
          });
        }
      }
    }
    this.slots.update.emit();
  };

  /** key-value store of blocks */
  private get _yBlocks() {
    return this.doc.getMap('blocks') as YBlocks;
  }

  private _getYBlock(id: string): YBlock {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      throw new Error(`Block with id ${id} does not exist`);
    }
    return yBlock;
  }

  get isEmpty() {
    return this._yBlocks.size <= 1; // has one page block by default
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

  private _createId(): string {
    return (i++).toString();
  }

  addBlock<T extends Partial<BlockProps>>(blockProps: T) {
    const { flavour } = blockProps;
    const id = this._createId();

    if (!flavour) {
      throw new Error('Block props must contain flavour');
    }

    if (this._yBlocks.has(id)) {
      throw new Error(`Block with id ${blockProps.id} already exists`);
    }

    blockProps.id = id;

    const yBlock = new Y.Map() as YBlock;
    syncBlockProps(yBlock, blockProps);

    this.transact(() => {
      this._yBlocks.set(id, yBlock);
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
}
