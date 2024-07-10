import { Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import { Text } from '../../reactive/text.js';
import type { BlockModel } from '../../schema/base.js';
import type { IdGenerator } from '../../utils/id-generator.js';
import type { AwarenessStore, BlockSuiteDoc } from '../../yjs/index.js';
import type { DocCollection } from '../collection.js';
import { Space } from '../space.js';
import { DocCRUD } from './crud.js';
import { type BlockSelector, BlockViewType, type YBlock } from './index.js';
import { Doc } from './index.js';

export type YBlocks = Y.Map<YBlock>;
type FlatBlockMap = Record<string, YBlock>;

/** JSON-serializable properties of a block */
export type BlockSysProps = {
  id: string;
  flavour: string;
  children?: BlockModel[];
};
export type BlockProps = BlockSysProps & Record<string, unknown>;

type DocOptions = {
  id: string;
  collection: DocCollection;
  doc: BlockSuiteDoc;
  awarenessStore: AwarenessStore;
  idGenerator?: IdGenerator;
};

export const defaultBlockSelector = () => BlockViewType.Display;

export type GetDocOptions = {
  selector?: BlockSelector;
  readonly?: boolean;
};

export class BlockCollection extends Space<FlatBlockMap> {
  get readonly() {
    return this.awarenessStore.isReadonly(this);
  }

  get ready() {
    return this._ready;
  }

  get history() {
    return this._history;
  }

  get crud() {
    return this._docCRUD;
  }

  get collection() {
    return this._collection;
  }

  get docSync() {
    return this.collection.docSync;
  }

  get awarenessSync() {
    return this.collection.awarenessSync;
  }

  get blobSync() {
    return this.collection.blobSync;
  }

  get schema() {
    return this.collection.schema;
  }

  get meta() {
    return this.collection.meta.getDocMeta(this.id);
  }

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get canUndo() {
    if (this.readonly) {
      return false;
    }
    return this._history.canUndo();
  }

  get canRedo() {
    if (this.readonly) {
      return false;
    }
    return this._history.canRedo();
  }

  get Text() {
    return Text;
  }

  private readonly _collection: DocCollection;

  private readonly _idGenerator: IdGenerator;

  private readonly _docCRUD: DocCRUD;

  private _history!: Y.UndoManager;

  /** Indicate whether the block tree is ready */
  private _ready = false;

  private _shouldTransact = true;

  private _docMap = {
    undefined: new WeakMap<BlockSelector, Doc>(),
    true: new WeakMap<BlockSelector, Doc>(),
    false: new WeakMap<BlockSelector, Doc>(),
  };

  readonly slots = {
    historyUpdated: new Slot(),
    yBlockUpdated: new Slot<
      | {
          type: 'add';
          id: string;
        }
      | {
          type: 'delete';
          id: string;
        }
    >(),
  };

  constructor({
    id,
    collection,
    doc,
    awarenessStore,
    idGenerator = uuidv4,
  }: DocOptions) {
    super(id, doc, awarenessStore);
    this._collection = collection;
    this._idGenerator = idGenerator;
    this._docCRUD = new DocCRUD(this._yBlocks, collection.schema);
  }

  private _getReadonlyKey(readonly?: boolean): 'true' | 'false' | 'undefined' {
    return (readonly?.toString() as 'true' | 'false') ?? 'undefined';
  }

  private _initYBlocks() {
    const { _yBlocks } = this;
    _yBlocks.observeDeep(this._handleYEvents);
    this._history = new Y.UndoManager([_yBlocks], {
      trackedOrigins: new Set([this._ySpaceDoc.clientID]),
    });

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyObserver);
    this._history.on('stack-item-popped', this._historyObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  private _historyObserver = () => {
    this.slots.historyUpdated.emit();
  };

  private _handleYBlockAdd(id: string) {
    this.slots.yBlockUpdated.emit({ type: 'add', id });
  }

  private _handleYBlockDelete(id: string) {
    this.slots.yBlockUpdated.emit({ type: 'delete', id });
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target !== this._yBlocks) {
      return;
    }
    event.keys.forEach((value, id) => {
      try {
        if (value.action === 'add') {
          this._handleYBlockAdd(id);
          return;
        }
        if (value.action === 'delete') {
          this._handleYBlockDelete(id);
          return;
        }
      } catch (e) {
        console.error('An error occurred while handling Yjs event:');
        console.error(e);
      }
    });
  }

  // Handle all the events that happen at _any_ level (potentially deep inside the structure).
  // So, we apply a listener at the top level for the flat structure of the current
  // doc/space container.
  private _handleYEvents = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    events.forEach(event => this._handleYEvent(event));
  };

  private _handleVersion() {
    // Initialization from empty yDoc, indicating that the document is new.
    if (!this.collection.meta.hasVersion) {
      this.collection.meta.writeVersion(this.collection);
    } else {
      // Initialization from existing yDoc, indicating that the document is loaded from storage.
      if (this.awarenessStore.getFlag('enable_legacy_validation')) {
        this.collection.meta.validateVersion(this.collection);
      }
    }
  }

  getDoc({ selector = defaultBlockSelector, readonly }: GetDocOptions = {}) {
    const readonlyKey = this._getReadonlyKey(readonly);

    if (this._docMap[readonlyKey].has(selector)) {
      return this._docMap[readonlyKey].get(selector)!;
    }

    const doc = new Doc({
      blockCollection: this,
      crud: this._docCRUD,
      schema: this.collection.schema,
      selector,
      readonly,
    });

    this._docMap[readonlyKey].set(selector, doc);

    return doc;
  }

  clearSelector(selector: BlockSelector, readonly?: boolean) {
    const readonlyKey = this._getReadonlyKey(readonly);

    this._docMap[readonlyKey].delete(selector);
  }

  withoutTransact(callback: () => void) {
    this._shouldTransact = false;
    callback();
    this._shouldTransact = true;
  }

  override transact(
    fn: () => void,
    shouldTransact: boolean = this._shouldTransact
  ) {
    super.transact(fn, shouldTransact);
  }

  undo() {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    this._history.undo();
  }

  redo() {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    this._history.redo();
  }

  /** Capture current operations to undo stack synchronously. */
  captureSync() {
    this._history.stopCapturing();
  }

  resetHistory() {
    this._history.clear();
  }

  generateBlockId() {
    return this._idGenerator();
  }

  override load(initFn?: () => void): this {
    if (this.ready) {
      return this;
    }

    super.load();

    if ((this.collection.meta.docs?.length ?? 0) <= 1) {
      this._handleVersion();
    }

    this._initYBlocks();

    this._yBlocks.forEach((_, id) => {
      this._handleYBlockAdd(id);
    });

    initFn?.();

    this._ready = true;

    return this;
  }

  dispose() {
    this.slots.historyUpdated.dispose();

    if (this.ready) {
      this._yBlocks.unobserveDeep(this._handleYEvents);
      this._yBlocks.clear();
    }
  }
}

declare global {
  namespace BlockSuite {
    interface BlockModels {}

    type Flavour = string & keyof BlockModels;

    type ModelProps<Model> = Partial<
      Model extends BlockModel<infer U> ? U : never
    >;
  }
}
