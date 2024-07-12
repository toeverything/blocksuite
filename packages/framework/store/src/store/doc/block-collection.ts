import { Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import type { BlockModel } from '../../schema/base.js';
import type { IdGenerator } from '../../utils/id-generator.js';
import type { AwarenessStore, BlockSuiteDoc } from '../../yjs/index.js';
import type { DocCollection } from '../collection.js';

import { Text } from '../../reactive/text.js';
import { Space } from '../space.js';
import { DocCRUD } from './crud.js';
import { type BlockSelector, BlockViewType, type YBlock } from './index.js';
import { Doc } from './index.js';

export type YBlocks = Y.Map<YBlock>;
type FlatBlockMap = Record<string, YBlock>;

/** JSON-serializable properties of a block */
export type BlockSysProps = {
  children?: BlockModel[];
  flavour: string;
  id: string;
};
export type BlockProps = BlockSysProps & Record<string, unknown>;

type DocOptions = {
  awarenessStore: AwarenessStore;
  collection: DocCollection;
  doc: BlockSuiteDoc;
  id: string;
  idGenerator?: IdGenerator;
};

export const defaultBlockSelector = () => BlockViewType.Display;

export type GetDocOptions = {
  readonly?: boolean;
  selector?: BlockSelector;
};

export class BlockCollection extends Space<FlatBlockMap> {
  private readonly _collection: DocCollection;

  private readonly _docCRUD: DocCRUD;

  private _docMap = {
    false: new WeakMap<BlockSelector, Doc>(),
    true: new WeakMap<BlockSelector, Doc>(),
    undefined: new WeakMap<BlockSelector, Doc>(),
  };

  // doc/space container.
  private _handleYEvents = (events: Y.YEvent<Y.Text | YBlock>[]) => {
    events.forEach(event => this._handleYEvent(event));
  };

  private _history!: Y.UndoManager;

  private _historyObserver = () => {
    this.slots.historyUpdated.emit();
  };

  private readonly _idGenerator: IdGenerator;

  /** Indicate whether the block tree is ready */
  private _ready = false;

  private _shouldTransact = true;

  readonly slots = {
    historyUpdated: new Slot(),
    yBlockUpdated: new Slot<
      | {
          id: string;
          type: 'add';
        }
      | {
          id: string;
          type: 'delete';
        }
    >(),
  };

  constructor({
    awarenessStore,
    collection,
    doc,
    id,
    idGenerator = uuidv4,
  }: DocOptions) {
    super(id, doc, awarenessStore);
    this._collection = collection;
    this._idGenerator = idGenerator;
    this._docCRUD = new DocCRUD(this._yBlocks, collection.schema);
  }

  private _getReadonlyKey(readonly?: boolean): 'false' | 'true' | 'undefined' {
    return (readonly?.toString() as 'false' | 'true') ?? 'undefined';
  }

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

  private _handleYBlockAdd(id: string) {
    this.slots.yBlockUpdated.emit({ id, type: 'add' });
  }

  private _handleYBlockDelete(id: string) {
    this.slots.yBlockUpdated.emit({ id, type: 'delete' });
  }

  private _handleYEvent(event: Y.YEvent<Y.Array<unknown> | Y.Text | YBlock>) {
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

  /** Capture current operations to undo stack synchronously. */
  captureSync() {
    this._history.stopCapturing();
  }

  clearSelector(selector: BlockSelector, readonly?: boolean) {
    const readonlyKey = this._getReadonlyKey(readonly);

    this._docMap[readonlyKey].delete(selector);
  }

  dispose() {
    this.slots.historyUpdated.dispose();

    if (this.ready) {
      this._yBlocks.unobserveDeep(this._handleYEvents);
      this._yBlocks.clear();
    }
  }

  generateBlockId() {
    return this._idGenerator();
  }

  getDoc({ readonly, selector = defaultBlockSelector }: GetDocOptions = {}) {
    const readonlyKey = this._getReadonlyKey(readonly);

    if (this._docMap[readonlyKey].has(selector)) {
      return this._docMap[readonlyKey].get(selector)!;
    }

    const doc = new Doc({
      blockCollection: this,
      crud: this._docCRUD,
      readonly,
      schema: this.collection.schema,
      selector,
    });

    this._docMap[readonlyKey].set(selector, doc);

    return doc;
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

  redo() {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    this._history.redo();
  }

  resetHistory() {
    this._history.clear();
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

  withoutTransact(callback: () => void) {
    this._shouldTransact = false;
    callback();
    this._shouldTransact = true;
  }

  get Text() {
    return Text;
  }

  // Handle all the events that happen at _any_ level (potentially deep inside the structure).
  // So, we apply a listener at the top level for the flat structure of the current
  get awarenessSync() {
    return this.collection.awarenessSync;
  }

  get blobSync() {
    return this.collection.blobSync;
  }

  get canRedo() {
    if (this.readonly) {
      return false;
    }
    return this._history.canRedo();
  }

  get canUndo() {
    if (this.readonly) {
      return false;
    }
    return this._history.canUndo();
  }

  get collection() {
    return this._collection;
  }

  get crud() {
    return this._docCRUD;
  }

  get docSync() {
    return this.collection.docSync;
  }

  get history() {
    return this._history;
  }

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get meta() {
    return this.collection.meta.getDocMeta(this.id);
  }

  get readonly() {
    return this.awarenessStore.isReadonly(this);
  }

  get ready() {
    return this._ready;
  }

  get schema() {
    return this.collection.schema;
  }
}

declare global {
  namespace BlockSuite {
    interface BlockModels {}

    type Flavour = keyof BlockModels & string;

    type ModelProps<Model> = Partial<
      Model extends BlockModel<infer U> ? U : never
    >;
  }
}
