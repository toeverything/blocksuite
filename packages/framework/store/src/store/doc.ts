import { assertExists, Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import { Text } from '../reactive/text.js';
import type { BlockModel } from '../schema/base.js';
import type { IdGenerator } from '../utils/id-generator.js';
import { syncBlockProps } from '../utils/utils.js';
import type { AwarenessStore, BlockSuiteDoc } from '../yjs/index.js';
import type { YBlock } from './block/index.js';
import { BlockCollection } from './block/index.js';
import type { DocCollection } from './collection.js';
import { DocCRUD } from './doc/crud.js';
import { Space } from './space.js';

export type YBlocks = Y.Map<YBlock>;
type FlatBlockMap = Record<string, YBlock>;

/** JSON-serializable properties of a block */
export type BlockSysProps = {
  id: string;
  flavour: string;
  children?: BlockModel[];
};
export type BlockProps = BlockSysProps & {
  [index: string]: unknown;
};

type DocOptions = {
  id: string;
  collection: DocCollection;
  doc: BlockSuiteDoc;
  awarenessStore: AwarenessStore;
  idGenerator?: IdGenerator;
};

export class Doc extends Space<FlatBlockMap> {
  private readonly _collection: DocCollection;
  private readonly _idGenerator: IdGenerator;
  private readonly _blockCollection: BlockCollection;
  private readonly _docCRUD: DocCRUD;
  private _history!: Y.UndoManager;
  /** Indicate whether the block tree is ready */
  private _ready = false;
  private _shouldTransact = true;

  readonly slots = {
    /** This is always triggered after `doc.load` is called. */
    ready: new Slot(),
    historyUpdated: new Slot(),
    /**
     * This fires when the root block is added via API call or has just been initialized from existing ydoc.
     * useful for internal block UI components to start subscribing following up events.
     * Note that at this moment, the whole block tree may not be fully initialized yet.
     */
    rootAdded: new Slot<BlockModel>(),
    rootDeleted: new Slot<string>(),
    blockUpdated: new Slot<
      | {
          type: 'add';
          id: string;
          flavour: string;
        }
      | {
          type: 'delete';
          id: string;
          flavour: string;
          parent: string;
          model: BlockModel;
        }
      | {
          type: 'update';
          id: string;
          flavour: string;
          props: { key: string };
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
    this._blockCollection = new BlockCollection({
      doc: this,
      crud: this._docCRUD,
      schema: collection.schema,
      selector: () => true,
    });
  }

  get readonly() {
    return this.awarenessStore.isReadonly(this);
  }

  get ready() {
    return this._ready;
  }

  get history() {
    return this._history;
  }

  get collection() {
    return this._collection;
  }

  get schema() {
    return this.collection.schema;
  }

  get meta() {
    return this.collection.meta.getDocMeta(this.id);
  }

  get blob() {
    return this.collection.blob;
  }

  get root() {
    const rootId = this._docCRUD.root;
    if (!rootId) return null;
    return this._blockCollection.getBlock(rootId)?.model ?? null;
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

  hasBlockById(id: string): boolean {
    return this._blockCollection.hasBlock(id);
  }

  getBlockById<Model extends BlockModel = BlockModel>(
    id: string
  ): Model | null {
    return (this._blockCollection.getBlock(id)?.model as Model) ?? null;
  }

  getBlockByFlavour(blockFlavour: string | string[]) {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return this.getBlocks().filter(model => flavours.includes(model.flavour));
  }

  getParent(target: BlockModel | string): BlockModel | null {
    return this._blockCollection.getParent(target);
  }

  getPreviousSibling(block: BlockModel) {
    return this._blockCollection.getPrev(block);
  }

  getPreviousSiblings(block: BlockModel) {
    return this._blockCollection.getPrevs(block);
  }

  getNextSibling(block: BlockModel) {
    return this._blockCollection.getNext(block);
  }

  getNextSiblings(block: BlockModel) {
    return this._blockCollection.getNexts(block);
  }

  getSchemaByFlavour(flavour: string) {
    return this.schema.flavourSchemaMap.get(flavour);
  }

  getBlocks() {
    return this._blockCollection.getBlocks().map(block => block.model);
  }

  addBlocks(
    blocks: Array<{
      flavour: string;
      blockProps?: Partial<BlockProps & Omit<BlockProps, 'flavour' | 'id'>>;
    }>,
    parent?: BlockModel | string | null,
    parentIndex?: number
  ): string[] {
    const ids: string[] = [];
    blocks.forEach(block => {
      const id = this.addBlock(
        block.flavour as never,
        block.blockProps ?? {},
        parent,
        parentIndex
      );
      ids.push(id);
      typeof parentIndex === 'number' && parentIndex++;
    });

    return ids;
  }

  addBlock<Key extends BlockSuite.Flavour>(
    flavour: Key,
    blockProps?: BlockSuite.ModelProps<BlockSuite.BlockModels[Key]>,
    parent?: BlockModel | string | null,
    parentIndex?: number
  ): string;
  addBlock(
    flavour: never,
    blockProps?: Partial<BlockProps & Omit<BlockProps, 'flavour'>>,
    parent?: BlockModel | string | null,
    parentIndex?: number
  ): string;
  addBlock(
    flavour: string,
    blockProps: Partial<BlockProps & Omit<BlockProps, 'flavour'>> = {},
    parent?: BlockModel | string | null,
    parentIndex?: number
  ): string {
    if (this.readonly) {
      throw new Error('cannot modify data in readonly mode');
    }

    const id = blockProps.id ?? this._idGenerator();

    this.transact(() => {
      this._docCRUD.addBlock(
        id,
        flavour,
        { ...blockProps },
        typeof parent === 'string' ? parent : parent?.id,
        parentIndex
      );
    });

    return id;
  }

  moveBlocks(
    blocksToMove: BlockModel[],
    newParent: BlockModel,
    targetSibling: BlockModel | null = null,
    shouldInsertBeforeSibling = true
  ) {
    if (this.readonly) {
      console.error('Cannot modify data in read-only mode');
      return;
    }

    this.transact(() => {
      this._docCRUD.moveBlocks(
        blocksToMove.map(model => model.id),
        newParent.id,
        targetSibling?.id ?? null,
        shouldInsertBeforeSibling
      );
    });
  }

  updateBlock<T extends Partial<BlockProps>>(model: BlockModel, props: T): void;
  updateBlock(model: BlockModel, callback: () => void): void;
  updateBlock(
    model: BlockModel,
    callBackOrProps: (() => void) | Partial<BlockProps>
  ): void {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const isCallback = typeof callBackOrProps === 'function';

    if (!isCallback) {
      const parent = this.getParent(model);
      this.schema.validate(
        model.flavour,
        parent?.flavour,
        callBackOrProps.children?.map(child => child.flavour)
      );
    }

    const yBlock = this._yBlocks.get(model.id);
    assertExists(yBlock);

    this.transact(() => {
      if (isCallback) {
        callBackOrProps();
        return;
      }

      if (callBackOrProps.children) {
        this._docCRUD.updateBlockChildren(
          model.id,
          callBackOrProps.children.map(child => child.id)
        );
      }

      const schema = this.schema.flavourSchemaMap.get(model.flavour);
      assertExists(schema);
      syncBlockProps(schema, model, yBlock, callBackOrProps);
      return;
    });
  }

  addSiblingBlocks(
    targetModel: BlockModel,
    props: Array<Partial<BlockProps>>,
    place: 'after' | 'before' = 'after'
  ): string[] {
    if (!props.length) return [];
    const parent = this.getParent(targetModel);
    assertExists(parent);

    const targetIndex =
      parent.children.findIndex(({ id }) => id === targetModel.id) ?? 0;
    const insertIndex = place === 'before' ? targetIndex : targetIndex + 1;

    if (props.length <= 1) {
      assertExists(props[0].flavour);
      const { flavour, ...blockProps } = props[0];
      const id = this.addBlock(
        flavour as never,
        blockProps,
        parent.id,
        insertIndex
      );
      return [id];
    }

    const blocks: Array<{
      flavour: string;
      blockProps: Partial<BlockProps>;
    }> = [];
    props.forEach(prop => {
      const { flavour, ...blockProps } = prop;
      assertExists(flavour);
      blocks.push({ flavour, blockProps });
    });
    return this.addBlocks(blocks, parent.id, insertIndex);
  }

  deleteBlock(
    model: BlockModel,
    options: {
      bringChildrenTo?: BlockModel;
      deleteChildren?: boolean;
    } = {
      deleteChildren: true,
    }
  ) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const opts = (
      options && options.bringChildrenTo
        ? {
            ...options,
            bringChildrenTo: options.bringChildrenTo.id,
          }
        : options
    ) as {
      bringChildrenTo?: string;
      deleteChildren?: boolean;
    };

    this.transact(() => {
      this._docCRUD.deleteBlock(model.id, opts);
    });
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
    this.slots.ready.emit();

    return this;
  }

  dispose() {
    this.slots.historyUpdated.dispose();
    this.slots.rootAdded.dispose();
    this.slots.rootDeleted.dispose();
    this.slots.blockUpdated.dispose();

    if (this.ready) {
      this._yBlocks.unobserveDeep(this._handleYEvents);
      this._yBlocks.clear();
    }
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
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      console.warn(
        `Failed to handle yBlock add, yBlock with id-${id} not found`
      );
      return;
    }

    const flavour = yBlock.get('sys:flavour');
    this.slots.blockUpdated.emit({ type: 'add', id, flavour });

    const model = this.getBlockById(id);
    if (!model) return;
    if (model.role === 'root') {
      this.slots.rootAdded.emit(model);
    }
  }

  private _handleYBlockDelete(id: string) {
    const model = this.getBlockById(id);
    if (!model) return;

    if (model === this.root) {
      this.slots.rootDeleted.emit(id);
    }
    this.slots.blockUpdated.emit({
      type: 'delete',
      id,
      flavour: model.flavour,
      parent: this.getParent(model)?.id ?? '',
      model,
    });
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target !== this._yBlocks) {
      return;
    }
    event.keys.forEach((value, id) => {
      if (value.action === 'add') {
        this._handleYBlockAdd(id);
        return;
      }
      if (value.action === 'delete') {
        this._handleYBlockDelete(id);
        return;
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
