import { Container, type ServiceProvider } from '@blocksuite/global/di';
import { DisposableGroup } from '@blocksuite/global/disposable';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { computed, signal } from '@preact/signals-core';
import { Subject } from 'rxjs';

import type { ExtensionType } from '../../extension/extension.js';
import {
  BlockSchemaIdentifier,
  StoreExtensionIdentifier,
  StoreSelectionExtension,
} from '../../extension/index.js';
import { Schema } from '../../schema/index.js';
import type { TransformerMiddleware } from '../../transformer/middleware.js';
import { Transformer } from '../../transformer/transformer.js';
import {
  Block,
  type BlockModel,
  type BlockOptions,
  type BlockProps,
} from '../block/index.js';
import type { Doc } from '../doc.js';
import { DocCRUD } from './crud.js';
import { StoreIdentifier } from './identifier.js';
import { type Query, runQuery } from './query.js';
import { syncBlockProps } from './utils.js';

export type StoreOptions = {
  doc: Doc;
  id?: string;
  readonly?: boolean;
  query?: Query;
  provider?: ServiceProvider;
  extensions?: ExtensionType[];
};

export type BlockUpdatedPayload =
  | {
      type: 'add';
      id: string;
      isLocal: boolean;
      init: boolean;
      flavour: string;
      model: BlockModel;
    }
  | {
      type: 'delete';
      id: string;
      isLocal: boolean;
      flavour: string;
      parent: string;
      model: BlockModel;
    }
  | {
      type: 'update';
      id: string;
      isLocal: boolean;
      flavour: string;
      props: { key: string };
    };

const internalExtensions = [StoreSelectionExtension];

export class Store {
  readonly userExtensions: ExtensionType[];

  disposableGroup = new DisposableGroup();

  private readonly _provider: ServiceProvider;

  private readonly _runQuery = (block: Block) => {
    runQuery(this._query, block);
  };

  private readonly _doc: Doc;

  private readonly _blocks = signal<Record<string, Block>>({});

  private readonly _crud: DocCRUD;

  private readonly _query: Query = {
    match: [],
    mode: 'loose',
  };

  private readonly _readonly = signal(false);

  private readonly _isEmpty = computed(() => {
    return this.root?.isEmpty() ?? true;
  });

  private readonly _schema: Schema;

  readonly slots: Doc['slots'] & {
    /** This is always triggered after `doc.load` is called. */
    ready: Subject<void>;
    /**
     * This fires when the root block is added via API call or has just been initialized from existing ydoc.
     * useful for internal block UI components to start subscribing following up events.
     * Note that at this moment, the whole block tree may not be fully initialized yet.
     */
    rootAdded: Subject<string>;
    rootDeleted: Subject<string>;
    blockUpdated: Subject<BlockUpdatedPayload>;
  };

  updateBlock: {
    <T extends Partial<BlockProps>>(model: BlockModel | string, props: T): void;
    (model: BlockModel | string, callback: () => void): void;
  } = (
    modelOrId: BlockModel | string,
    callBackOrProps: (() => void) | Partial<BlockProps>
  ) => {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const isCallback = typeof callBackOrProps === 'function';

    const model =
      typeof modelOrId === 'string'
        ? this.getBlock(modelOrId)?.model
        : modelOrId;
    if (!model) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        `updating block: ${modelOrId} not found`
      );
    }

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
  };

  private get _yBlocks() {
    return this._doc.yBlocks;
  }

  get awarenessStore() {
    return this._doc.awarenessStore;
  }

  get provider() {
    return this._provider;
  }

  get blobSync() {
    return this.workspace.blobSync;
  }

  get doc() {
    return this._doc;
  }

  get blocks() {
    return this._blocks;
  }

  get blockSize() {
    return Object.values(this._blocks.peek()).length;
  }

  get canRedo() {
    if (this.readonly) {
      return false;
    }
    return this._doc.canRedo;
  }

  get canUndo() {
    if (this.readonly) {
      return false;
    }
    return this._doc.canUndo;
  }

  get captureSync() {
    return this._doc.captureSync.bind(this._doc);
  }

  get clear() {
    return this._doc.clear.bind(this._doc);
  }

  get workspace() {
    return this._doc.workspace;
  }

  get history() {
    return this._doc.history;
  }

  get id() {
    return this._doc.id;
  }

  get isEmpty() {
    return this._isEmpty.peek();
  }

  get isEmpty$() {
    return this._isEmpty;
  }

  get loaded() {
    return this._doc.loaded;
  }

  get meta() {
    return this._doc.meta;
  }

  get readonly$() {
    return this._readonly;
  }

  get readonly() {
    return this._readonly.value === true;
  }

  set readonly(value: boolean) {
    this._readonly.value = value;
  }

  get ready() {
    return this._doc.ready;
  }

  get redo() {
    if (this.readonly) {
      return () => {
        console.error('cannot undo in readonly mode');
      };
    }
    return this._doc.redo.bind(this._doc);
  }

  get resetHistory() {
    return this._doc.resetHistory.bind(this._doc);
  }

  get root() {
    const rootId = this._crud.root;
    if (!rootId) return null;
    return this.getBlock(rootId)?.model ?? null;
  }

  get rootDoc() {
    return this._doc.rootDoc;
  }

  get schema() {
    return this._schema;
  }

  get spaceDoc() {
    return this._doc.spaceDoc;
  }

  get transact() {
    return this._doc.transact.bind(this._doc);
  }

  get undo() {
    if (this.readonly) {
      return () => {
        console.error('cannot undo in readonly mode');
      };
    }
    return this._doc.undo.bind(this._doc);
  }

  get withoutTransact() {
    return this._doc.withoutTransact.bind(this._doc);
  }

  private _isDisposed = false;

  constructor({ doc, readonly, query, provider, extensions }: StoreOptions) {
    this._doc = doc;
    this.slots = {
      ready: new Subject(),
      rootAdded: new Subject(),
      rootDeleted: new Subject(),
      blockUpdated: new Subject(),
      historyUpdated: this._doc.slots.historyUpdated,
      yBlockUpdated: this._doc.slots.yBlockUpdated,
    };
    this._schema = new Schema();

    const container = new Container();
    container.addImpl(StoreIdentifier, () => this);

    internalExtensions.forEach(ext => {
      ext.setup(container);
    });

    const userExtensions = extensions ?? [];
    this.userExtensions = userExtensions;
    userExtensions.forEach(extension => {
      extension.setup(container);
    });

    this._provider = container.provider(undefined, provider);
    this._provider.getAll(BlockSchemaIdentifier).forEach(schema => {
      this._schema.register([schema]);
    });
    this._crud = new DocCRUD(this._yBlocks, this._schema);
    if (readonly !== undefined) {
      this._readonly.value = readonly;
    }
    if (query) {
      this._query = query;
    }

    this._yBlocks.forEach((_, id) => {
      if (id in this._blocks.peek()) {
        return;
      }
      this._onBlockAdded(id, false, true);
    });

    this._subscribeToSlots();
  }

  private readonly _subscribeToSlots = () => {
    this.disposableGroup.add(
      this._doc.slots.yBlockUpdated.subscribe(({ type, id, isLocal }) => {
        switch (type) {
          case 'add': {
            this._onBlockAdded(id, isLocal, false);
            return;
          }
          case 'delete': {
            this._onBlockRemoved(id, isLocal);
            return;
          }
        }
      })
    );
    this.disposableGroup.add(this.slots.ready);
    this.disposableGroup.add(this.slots.blockUpdated);
    this.disposableGroup.add(this.slots.rootAdded);
    this.disposableGroup.add(this.slots.rootDeleted);
  };

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

  private _onBlockAdded(id: string, isLocal: boolean, init: boolean) {
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
        onChange: (block, key, isLocal) => {
          if (key) {
            block.model.propsUpdated.next({ key });
          }

          this.slots.blockUpdated.next({
            type: 'update',
            id,
            flavour: block.flavour,
            props: { key },
            isLocal,
          });
        },
      };

      const block = new Block(this._schema, yBlock, this, options);
      this._runQuery(block);

      this._blocks.value = {
        ...this._blocks.value,
        [id]: block,
      };
      block.model.created.next();

      if (block.model.role === 'root') {
        this.slots.rootAdded.next(id);
      }

      this.slots.blockUpdated.next({
        type: 'add',
        id,
        init,
        flavour: block.model.flavour,
        model: block.model,
        isLocal,
      });
    } catch (e) {
      console.error('An error occurred while adding block:');
      console.error(e);
    }
  }

  private _onBlockRemoved(id: string, isLocal: boolean) {
    try {
      const block = this.getBlock(id);
      if (!block) return;

      if (block.model.role === 'root') {
        this.slots.rootDeleted.next(id);
      }

      this.slots.blockUpdated.next({
        type: 'delete',
        id,
        flavour: block.flavour,
        parent: this.getParent(block.model)?.id ?? '',
        model: block.model,
        isLocal,
      });

      const { [id]: _, ...blocks } = this._blocks.peek();
      this._blocks.value = blocks;

      block.model.deleted.next();
      block.model.dispose();
    } catch (e) {
      console.error('An error occurred while removing block:');
      console.error(e);
    }
  }

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

    const id = blockProps.id ?? this._doc.workspace.idGenerator();

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
    model: BlockModel | string,
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
      this._crud.deleteBlock(
        typeof model === 'string' ? model : model.id,
        opts
      );
    });
  }

  dispose() {
    this._provider.getAll(StoreExtensionIdentifier).forEach(ext => {
      ext.disposed();
    });
    this.slots.ready.complete();
    this.slots.rootAdded.complete();
    this.slots.rootDeleted.complete();
    this.slots.blockUpdated.complete();
    this.disposableGroup.dispose();
    this._isDisposed = true;
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

  getStore() {
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

  getSchemaByFlavour(flavour: string) {
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
    if (this._isDisposed) {
      this.disposableGroup = new DisposableGroup();
      this._subscribeToSlots();
      this._isDisposed = false;
    }

    this._doc.load(initFn);
    this._provider.getAll(StoreExtensionIdentifier).forEach(ext => {
      ext.loaded();
    });
    this.slots.ready.next();
    this.slots.rootAdded.next(this.root?.id ?? '');
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

  get get() {
    return this.provider.get.bind(this.provider);
  }

  get getOptional() {
    return this.provider.getOptional.bind(this.provider);
  }

  getTransformer(middlewares: TransformerMiddleware[] = []) {
    return new Transformer({
      schema: this.schema,
      blobCRUD: this.workspace.blobSync,
      docCRUD: {
        create: (id: string) => this.workspace.createDoc({ id }),
        get: (id: string) => this.workspace.getDoc(id),
        delete: (id: string) => this.workspace.removeDoc(id),
      },
      middlewares,
    });
  }
}
