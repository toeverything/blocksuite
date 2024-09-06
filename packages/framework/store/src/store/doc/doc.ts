import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { type Disposable, Slot } from '@blocksuite/global/utils';
import { signal } from '@preact/signals-core';

import type { BlockModel, Schema } from '../../schema/index.js';
import type { BlockOptions } from './block/index.js';
import type { BlockCollection, BlockProps } from './block-collection.js';
import type { DocCRUD } from './crud.js';

import { syncBlockProps } from '../../utils/utils.js';
import { Block } from './block/index.js';
import { type Query, runQuery } from './query.js';

type DocOptions = {
  schema: Schema;
  blockCollection: BlockCollection;
  crud: DocCRUD;
  readonly?: boolean;
  query?: Query;
};

export class Doc {
  private _runQuery = (block: Block) => {
    runQuery(this._query, block);
  };

  protected readonly _blockCollection: BlockCollection;

  protected readonly _blocks = signal<Record<string, Block>>({});

  protected readonly _crud: DocCRUD;

  protected readonly _disposeBlockUpdated: Disposable;

  protected readonly _query: Query = {
    match: [],
    mode: 'loose',
  };

  protected readonly _readonly?: boolean;

  protected readonly _schema: Schema;

  readonly slots: BlockCollection['slots'] & {
    /** This is always triggered after `doc.load` is called. */
    ready: Slot;
    /**
     * This fires when the root block is added via API call or has just been initialized from existing ydoc.
     * useful for internal block UI components to start subscribing following up events.
     * Note that at this moment, the whole block tree may not be fully initialized yet.
     */
    rootAdded: Slot<string>;
    rootDeleted: Slot<string>;
    blockUpdated: Slot<
      | {
          type: 'add';
          id: string;
          init: boolean;
          flavour: string;
          model: BlockModel;
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
    >;
  };

  private get _yBlocks() {
    return this._blockCollection.yBlocks;
  }

  get awarenessStore() {
    return this._blockCollection.awarenessStore;
  }

  get awarenessSync() {
    return this.collection.awarenessSync;
  }

  get blobSync() {
    return this.collection.blobSync;
  }

  get blockCollection() {
    return this._blockCollection;
  }

  get blocks() {
    return this._blocks;
  }

  get blockSize() {
    return Object.values(this._blocks.peek()).length;
  }

  get canRedo() {
    return this._blockCollection.canRedo;
  }

  get canUndo() {
    return this._blockCollection.canUndo;
  }

  get captureSync() {
    return this._blockCollection.captureSync.bind(this._blockCollection);
  }

  get clear() {
    return this._blockCollection.clear.bind(this._blockCollection);
  }

  get collection() {
    return this._blockCollection.collection;
  }

  get docSync() {
    return this.collection.docSync;
  }

  get generateBlockId() {
    return this._blockCollection.generateBlockId.bind(this._blockCollection);
  }

  get history() {
    return this._blockCollection.history;
  }

  get id() {
    return this._blockCollection.id;
  }

  get isEmpty() {
    return Object.values(this._blocks.peek()).length === 0;
  }

  get loaded() {
    return this._blockCollection.loaded;
  }

  get meta() {
    return this._blockCollection.meta;
  }

  get readonly() {
    if (this._blockCollection.readonly) {
      return true;
    }
    return this._readonly === true;
  }

  get ready() {
    return this._blockCollection.ready;
  }

  get redo() {
    return this._blockCollection.redo.bind(this._blockCollection);
  }

  get resetHistory() {
    return this._blockCollection.resetHistory.bind(this._blockCollection);
  }

  get root() {
    const rootId = this._crud.root;
    if (!rootId) return null;
    return this.getBlock(rootId)?.model ?? null;
  }

  get rootDoc() {
    return this._blockCollection.rootDoc;
  }

  get schema() {
    return this._schema;
  }

  get spaceDoc() {
    return this._blockCollection.spaceDoc;
  }

  get Text() {
    return this._blockCollection.Text;
  }

  get transact() {
    return this._blockCollection.transact.bind(this._blockCollection);
  }

  get undo() {
    return this._blockCollection.undo.bind(this._blockCollection);
  }

  get withoutTransact() {
    return this._blockCollection.withoutTransact.bind(this._blockCollection);
  }

  constructor({ schema, blockCollection, crud, readonly, query }: DocOptions) {
    this._blockCollection = blockCollection;

    this.slots = {
      ready: new Slot(),
      rootAdded: new Slot(),
      rootDeleted: new Slot(),
      blockUpdated: new Slot(),
      historyUpdated: this._blockCollection.slots.historyUpdated,
      yBlockUpdated: this._blockCollection.slots.yBlockUpdated,
    };

    this._crud = crud;
    this._schema = schema;
    this._readonly = readonly;
    if (query) {
      this._query = query;
    }

    this._yBlocks.forEach((_, id) => {
      if (id in this._blocks.peek()) {
        return;
      }
      this._onBlockAdded(id, true);
    });

    this._disposeBlockUpdated = this._blockCollection.slots.yBlockUpdated.on(
      ({ type, id }) => {
        switch (type) {
          case 'add': {
            this._onBlockAdded(id);
            return;
          }
          case 'delete': {
            this._onBlockRemoved(id);
            return;
          }
        }
      }
    );
  }

  private _getSiblings<T>(
    block: BlockModel | string,
    fn: (parent: BlockModel, index: number) => T
  ) {
    const parent = this.getParent(block);
    if (!parent) return null;

    const blockModel =
      typeof block === 'string' ? this.getBlock(block)?.model : block;
    if (!blockModel) return null;

    const index = parent.children.indexOf(blockModel);
    if (index === -1) return null;

    return fn(parent, index);
  }

  private _onBlockAdded(id: string, init = false) {
    try {
      if (id in this._blocks.peek()) {
        return;
      }
      const yBlock = this._yBlocks.get(id);
      if (!yBlock) {
        console.warn(`Could not find block with id ${id}`);
        return;
      }

      const options: BlockOptions = {
        onChange: (block, key) => {
          if (key) {
            block.model.propsUpdated.emit({ key });
          }

          this.slots.blockUpdated.emit({
            type: 'update',
            id,
            flavour: block.flavour,
            props: { key },
          });
        },
      };

      const block = new Block(this._schema, yBlock, this, options);
      this._runQuery(block);

      this._blocks.value = {
        ...this._blocks.value,
        [id]: block,
      };
      block.model.created.emit();

      if (block.model.role === 'root') {
        this.slots.rootAdded.emit(id);
      }

      this.slots.blockUpdated.emit({
        type: 'add',
        id,
        init,
        flavour: block.model.flavour,
        model: block.model,
      });
    } catch (e) {
      console.error('An error occurred while adding block:');
      console.error(e);
    }
  }

  private _onBlockRemoved(id: string) {
    try {
      const block = this.getBlock(id);
      if (!block) return;

      if (block.model.role === 'root') {
        this.slots.rootDeleted.emit(id);
      }

      this.slots.blockUpdated.emit({
        type: 'delete',
        id,
        flavour: block.model.flavour,
        parent: this.getParent(block.model)?.id ?? '',
        model: block.model,
      });

      const { [id]: _, ...blocks } = this._blocks.peek();
      this._blocks.value = blocks;

      block.model.deleted.emit();
      block.model.dispose();
    } catch (e) {
      console.error('An error occurred while removing block:');
      console.error(e);
    }
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
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        'cannot modify data in readonly mode'
      );
    }

    const id = blockProps.id ?? this._blockCollection.generateBlockId();

    this.transact(() => {
      this._crud.addBlock(
        id,
        flavour,
        { ...blockProps },
        typeof parent === 'string' ? parent : parent?.id,
        parentIndex
      );
    });

    return id;
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

  addSiblingBlocks(
    targetModel: BlockModel,
    props: Array<Partial<BlockProps>>,
    place: 'after' | 'before' = 'after'
  ): string[] {
    if (!props.length) return [];
    const parent = this.getParent(targetModel);
    if (!parent) return [];

    const targetIndex =
      parent.children.findIndex(({ id }) => id === targetModel.id) ?? 0;
    const insertIndex = place === 'before' ? targetIndex : targetIndex + 1;

    if (props.length <= 1) {
      if (!props[0]?.flavour) return [];
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
      if (!flavour) return;
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
      this._crud.deleteBlock(model.id, opts);
    });
  }

  dispose() {
    this._disposeBlockUpdated.dispose();
    this.slots.ready.dispose();
    this.slots.blockUpdated.dispose();
    this.slots.rootAdded.dispose();
    this.slots.rootDeleted.dispose();
  }

  getBlock(id: string): Block | undefined {
    return this._blocks.peek()[id];
  }

  getBlock$(id: string): Block | undefined {
    return this._blocks.value[id];
  }

  /**
   * @deprecated
   * Use `getBlocksByFlavour` instead.
   */
  getBlockByFlavour(blockFlavour: string | string[]) {
    return this.getBlocksByFlavour(blockFlavour).map(x => x.model);
  }

  /**
   * @deprecated
   * Use `getBlock` instead.
   */
  getBlockById<Model extends BlockModel = BlockModel>(
    id: string
  ): Model | null {
    return (this.getBlock(id)?.model ?? null) as Model | null;
  }

  getBlocks() {
    return Object.values(this._blocks.peek()).map(block => block.model);
  }

  getBlocksByFlavour(blockFlavour: string | string[]) {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return Object.values(this._blocks.peek()).filter(({ flavour }) =>
      flavours.includes(flavour)
    );
  }

  getNext(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index + 1] ?? null
    );
  }

  getNexts(block: BlockModel | string) {
    return (
      this._getSiblings(block, (parent, index) =>
        parent.children.slice(index + 1)
      ) ?? []
    );
  }

  getParent(target: BlockModel | string): BlockModel | null {
    const targetId = typeof target === 'string' ? target : target.id;
    const parentId = this._crud.getParent(targetId);
    if (!parentId) return null;

    const parent = this._blocks.peek()[parentId];
    if (!parent) return null;

    return parent.model;
  }

  getPrev(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index - 1] ?? null
    );
  }

  getPrevs(block: BlockModel | string) {
    return (
      this._getSiblings(block, (parent, index) =>
        parent.children.slice(0, index)
      ) ?? []
    );
  }

  getSchemaByFlavour(flavour: BlockSuite.Flavour) {
    return this._schema.flavourSchemaMap.get(flavour);
  }

  hasBlock(id: string) {
    return id in this._blocks.peek();
  }

  /**
   * @deprecated
   * Use `hasBlock` instead.
   */
  hasBlockById(id: string) {
    return this.hasBlock(id);
  }

  load(initFn?: () => void) {
    this._blockCollection.load(initFn);
    this.slots.ready.emit();
    return this;
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
      this._crud.moveBlocks(
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
    if (!yBlock) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        `updating block: ${model.id} not found`
      );
    }

    const block = this.getBlock(model.id);
    if (!block) return;

    this.transact(() => {
      if (isCallback) {
        callBackOrProps();
        this._runQuery(block);
        return;
      }

      if (callBackOrProps.children) {
        this._crud.updateBlockChildren(
          model.id,
          callBackOrProps.children.map(child => child.id)
        );
      }

      const schema = this.schema.flavourSchemaMap.get(model.flavour);
      if (!schema) {
        throw new BlockSuiteError(
          ErrorCode.ModelCRUDError,
          `schema for flavour: ${model.flavour} not found`
        );
      }
      syncBlockProps(schema, model, yBlock, callBackOrProps);
      this._runQuery(block);
      return;
    });
  }
}
