import { assertExists, Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import { Text } from '../reactive/text.js';
import type { BaseBlockModel } from '../schema/base.js';
import { internalPrimitives } from '../schema/base.js';
import type { IdGenerator } from '../utils/id-generator.js';
import { assertValidChildren, syncBlockProps } from '../utils/utils.js';
import type { AwarenessStore, BlockSuiteDoc } from '../yjs/index.js';
import type { YBlock } from './block/index.js';
import { BlockTree } from './block/index.js';
import type { PageMeta } from './meta.js';
import type { Workspace } from './workspace.js';

export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
export type BlockSysProps = {
  id: string;
  flavour: string;
  children?: BaseBlockModel[];
};
export type BlockProps = BlockSysProps & {
  [index: string]: unknown;
};

type PageOptions = {
  id: string;
  workspace: Workspace;
  doc: BlockSuiteDoc;
  awarenessStore: AwarenessStore;
  idGenerator?: IdGenerator;
};

export class Page extends BlockTree {
  private readonly _workspace: Workspace;
  private readonly _idGenerator: IdGenerator;
  private _history!: Y.UndoManager;
  private _root: BaseBlockModel | null = null;
  /** Indicate whether the underlying subdoc has been loaded. */
  private _docLoaded = false;
  /** Indicate whether the block tree is ready */
  private _ready = false;
  private _shouldTransact = true;

  readonly slots = {
    /**
     * This fires when the block tree is initialized via API call or underlying existing ydoc binary.
     * Note that this is different with the `doc.loaded` field,
     * since `loaded` only indicates that the ydoc is loaded, not the block tree.
     */
    ready: new Slot(),
    historyUpdated: new Slot(),
    /**
     * This fires when the root block is added via API call or has just been initialized from existing ydoc.
     * useful for internal block UI components to start subscribing following up events.
     * Note that at this moment, the whole block tree may not be fully initialized yet.
     */
    rootAdded: new Slot<BaseBlockModel>(),
    rootDeleted: new Slot<string | string[]>(),
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
          model: BaseBlockModel;
        }
      | {
          type: 'update';
          id: string;
          flavour: string;
        }
    >(),
  };

  constructor({
    id,
    workspace,
    doc,
    awarenessStore,
    idGenerator = uuidv4,
  }: PageOptions) {
    super({ id, doc, awarenessStore, schema: workspace.schema });
    this._workspace = workspace;
    this._idGenerator = idGenerator;
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

  get workspace() {
    return this._workspace;
  }

  get schema() {
    return this._schema;
  }

  get meta() {
    return this.workspace.meta.getPageMeta(this.id) as PageMeta;
  }

  get blob() {
    return this.workspace.blob;
  }

  get root() {
    return this._root;
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
    return this._idGenerator('block');
  }

  getBlockById(id: string) {
    return this._blocks.get(id)?.model ?? null;
  }

  getBlockByFlavour(blockFlavour: string | string[]) {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return Array.from(this._blocks.values())
      .filter(({ flavour }) => flavours.includes(flavour))
      .map(x => x.model);
  }

  getParent(target: BaseBlockModel | string): BaseBlockModel | null {
    const root = this._root;
    const targetId = typeof target === 'string' ? target : target.id;
    if (!root || root.id === targetId) return null;

    const findParent = (parentId: string): BaseBlockModel | null => {
      const parentModel = this.getBlockById(parentId);
      if (!parentModel) return null;

      for (const [childId] of parentModel.childMap) {
        if (childId === targetId) return parentModel;

        const parent = findParent(childId);
        if (parent !== null) return parent;
      }

      return null;
    };

    const parent = findParent(root.id);
    if (parent !== null) return parent;

    return null;
  }

  getPreviousSibling(block: BaseBlockModel) {
    const parent = this.getParent(block);
    if (!parent) {
      return null;
    }
    const index = parent.children.indexOf(block);
    if (index === -1) {
      throw new Error(
        "Failed to getPreviousSiblings! Block not found in parent's children"
      );
    }
    return parent.children[index - 1] ?? null;
  }

  getPreviousSiblings(block: BaseBlockModel) {
    const parent = this.getParent(block);
    if (!parent) {
      return [];
    }
    const index = parent.children.indexOf(block);
    if (index === -1) {
      throw new Error(
        "Failed to getPreviousSiblings! Block not found in parent's children"
      );
    }
    return parent.children.slice(0, index);
  }

  getNextSibling(block: BaseBlockModel) {
    const parent = this.getParent(block);
    if (!parent) {
      return null;
    }
    const index = parent.children.indexOf(block);
    if (index === -1) {
      throw new Error(
        "Failed to getPreviousSiblings! Block not found in parent's children"
      );
    }
    return parent.children[index + 1] ?? null;
  }

  getNextSiblings(block: BaseBlockModel) {
    const parent = this.getParent(block);
    if (!parent) {
      return [];
    }
    const index = parent.children.indexOf(block);
    if (index === -1) {
      throw new Error(
        "Failed to getNextSiblings! Block not found in parent's children"
      );
    }
    return parent.children.slice(index + 1);
  }

  getSchemaByFlavour(flavour: string) {
    return this.schema.flavourSchemaMap.get(flavour);
  }

  getInitialPropsByFlavour(flavour: string) {
    const schema = this.schema.flavourSchemaMap.get(flavour);
    assertExists(schema);
    return schema.model.props?.(internalPrimitives) ?? {};
  }

  addBlocks(
    blocks: Array<{
      flavour: string;
      blockProps?: Partial<BlockProps & Omit<BlockProps, 'flavour' | 'id'>>;
    }>,
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ): string[] {
    const ids: string[] = [];
    blocks.forEach(block => {
      const id = this.addBlock(
        block.flavour,
        block.blockProps ?? {},
        parent,
        parentIndex
      );
      ids.push(id);
      typeof parentIndex === 'number' && parentIndex++;
    });

    return ids;
  }

  addBlock(
    flavour: string,
    blockProps: Partial<BlockProps & Omit<BlockProps, 'flavour'>> = {},
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ): string {
    if (this.readonly) {
      throw new Error('cannot modify data in readonly mode');
    }
    if (!flavour) {
      throw new Error('Block props must contain flavour');
    }
    const parentModel =
      typeof parent === 'string' ? this.getBlockById(parent) : parent;

    this.schema.validate(
      flavour,
      parentModel?.flavour,
      blockProps.children?.map(child => child.flavour)
    );

    const id = blockProps.id ?? this._idGenerator('block');
    const clonedProps: BlockSysProps & Partial<BlockProps> = {
      id,
      flavour,
      ...blockProps,
    };

    this.transact(() => {
      this._addBlock(id, flavour, { ...blockProps });
      // set the yBlock at the very beginning, otherwise yBlock will be always empty

      assertValidChildren(this._yBlocks, clonedProps);
      const schema = this.getSchemaByFlavour(flavour);
      assertExists(schema);

      const parentId =
        parentModel?.id ??
        (schema.model.role === 'root' ? undefined : this._root?.id);

      if (parentId) {
        const yParent = this._yBlocks.get(parentId) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;
        const index = parentIndex ?? yChildren.length;
        yChildren.insert(index, [id]);
      }
    });

    return id;
  }

  moveBlocks(
    blocksToMove: BaseBlockModel[],
    newParent: BaseBlockModel,
    targetSibling: BaseBlockModel | null = null,
    shouldInsertBeforeSibling = true
  ) {
    if (this.readonly) {
      console.error('Cannot modify data in read-only mode');
      return;
    }

    if (!newParent) {
      throw new Error("Can't find new parent block");
    }

    // A map to store parent block and their respective child blocks
    const childBlocksPerParent = new Map<BaseBlockModel, BaseBlockModel[]>();
    blocksToMove.forEach(block => {
      const parentBlock = this.getParent(block);

      if (!parentBlock) {
        throw new Error("Can't find parent block for the current block");
      }

      this.schema.validate(block.flavour, newParent.flavour);

      const childrenBlocksOfCurrentParent =
        childBlocksPerParent.get(parentBlock);
      if (childrenBlocksOfCurrentParent) {
        if (
          this.getNextSibling(
            childrenBlocksOfCurrentParent[
              childrenBlocksOfCurrentParent.length - 1
            ]
          ) !== block
        ) {
          throw new Error(
            'The blocks to move are not contiguous under their parent'
          );
        }
        childrenBlocksOfCurrentParent.push(block);
      } else {
        childBlocksPerParent.set(parentBlock, [block]);
      }
    });

    this.transact(() => {
      let insertIndex = 0;
      let first = true;
      for (const [parentBlock, blocksToMove] of childBlocksPerParent) {
        const targetParentBlock = this._yBlocks.get(newParent.id) as YBlock;
        const targetParentChildren = targetParentBlock.get(
          'sys:children'
        ) as Y.Array<string>;
        const sourceParentBlock = this._yBlocks.get(parentBlock.id) as YBlock;
        const sourceParentChildren = sourceParentBlock.get(
          'sys:children'
        ) as Y.Array<string>;

        // Get the IDs of blocks to move
        const idsOfBlocksToMove = blocksToMove.map(({ id }) => id);

        // Remove the blocks from their current parent
        const startIndex = sourceParentChildren
          .toArray()
          .findIndex(id => id === idsOfBlocksToMove[0]);
        sourceParentChildren.delete(startIndex, idsOfBlocksToMove.length);

        if (first) {
          if (targetSibling) {
            const targetIndex = targetParentChildren
              .toArray()
              .findIndex(id => id === targetSibling.id);
            if (targetIndex === -1) {
              throw new Error('Target sibling not found');
            }
            insertIndex = shouldInsertBeforeSibling
              ? targetIndex
              : targetIndex + 1;
          } else {
            insertIndex = targetParentChildren.length;
          }
          first = false;
        } else {
          insertIndex++;
        }

        targetParentChildren.insert(insertIndex, idsOfBlocksToMove);
      }
    });

    // Emit event to indicate that the children of these blocks have been updated
    Array.from(childBlocksPerParent.keys()).forEach(parent =>
      parent.childrenUpdated.emit()
    );

    newParent.childrenUpdated.emit();
  }

  updateBlock<T extends Partial<BlockProps>>(
    model: BaseBlockModel,
    props: T
  ): void;
  updateBlock(model: BaseBlockModel, callback: () => void): void;
  updateBlock(
    model: BaseBlockModel,
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
      if (!isCallback) {
        // TODO diff children changes
        // All child nodes will be deleted in the current behavior, then added again.
        // Through diff children changes, the experience can be improved.
        if (callBackOrProps.children) {
          const yChildren = new Y.Array<string>();
          yChildren.insert(
            0,
            callBackOrProps.children.map(child => child.id)
          );
          yBlock.set('sys:children', yChildren);
        }

        const schema = this.schema.flavourSchemaMap.get(model.flavour);
        assertExists(schema);
        syncBlockProps(schema, yBlock, callBackOrProps);
        return;
      }

      callBackOrProps();
    });
  }

  addSiblingBlocks(
    targetModel: BaseBlockModel,
    props: Array<Partial<BlockProps>>,
    place: 'after' | 'before' = 'after'
  ): string[] {
    if (!props.length) return [];
    const parent = this.getParent(targetModel);
    assertExists(parent);

    const targetIndex =
      parent.children.findIndex(({ id }) => id === targetModel.id) ?? 0;
    const insertIndex = place === 'before' ? targetIndex : targetIndex + 1;

    if (props.length > 1) {
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
    } else {
      assertExists(props[0].flavour);
      const { flavour, ...blockProps } = props[0];
      const id = this.addBlock(flavour, blockProps, parent.id, insertIndex);
      return [id];
    }
  }

  deleteBlock(
    model: BaseBlockModel,
    options: {
      bringChildrenTo?: BaseBlockModel;
      deleteChildren?: boolean;
    } = {
      deleteChildren: true,
    }
  ) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const { bringChildrenTo, deleteChildren } = options;
    if (bringChildrenTo && deleteChildren) {
      console.error(
        'Cannot bring children to another block and delete them at the same time'
      );
      return;
    }

    const yModel = this._yBlocks.get(model.id) as YBlock;
    const yModelChildren = yModel.get('sys:children') as Y.Array<string>;

    const parent = this.getParent(model);
    assertExists(parent);
    const yParent = this._yBlocks.get(parent.id) as YBlock;
    const yParentChildren = yParent.get('sys:children') as Y.Array<string>;
    const modelIndex = yParentChildren.toArray().indexOf(model.id);

    this.transact(() => {
      if (modelIndex > -1) {
        yParentChildren.delete(modelIndex, 1);
      }

      if (bringChildrenTo) {
        // validate children flavour
        model.children.forEach(child => {
          this.schema.validate(child.flavour, bringChildrenTo.flavour);
        });

        if (bringChildrenTo.id === parent.id) {
          // When bring children to parent, insert children to the original position of model
          yParentChildren.insert(modelIndex, yModelChildren.toArray());
        } else {
          const yBringChildrenTo = this._yBlocks.get(
            bringChildrenTo.id
          ) as YBlock;
          const yBringChildrenToChildren = yBringChildrenTo.get(
            'sys:children'
          ) as Y.Array<string>;
          yBringChildrenToChildren.push(yModelChildren.toArray());
        }
      } else {
        if (deleteChildren) {
          // delete children recursively
          const dl = (id: string) => {
            const yBlock = this._yBlocks.get(id) as YBlock;

            const yChildren = yBlock.get('sys:children') as Y.Array<string>;
            yChildren.forEach(id => {
              dl(id);
            });

            this._removeBlock(id);
          };

          yModelChildren.forEach(id => {
            dl(id);
          });
        }
      }

      this._removeBlock(model.id);

      parent.childrenUpdated.emit();
    });
  }

  trySyncFromExistingDoc() {
    if (this._docLoaded) {
      throw new Error('Cannot sync from existing doc more than once');
    }

    if ((this.workspace.meta.pages?.length ?? 0) <= 1) {
      this._handleVersion();
    }

    this._initYBlocks();

    this._yBlocks.forEach((_, id) => {
      this._handleYBlockAdd(id);
    });

    this._docLoaded = true;

    if (this._yBlocks.size > 0) {
      this._ready = true;
      this.slots.ready.emit();
    }
  }

  dispose() {
    this.slots.historyUpdated.dispose();
    this.slots.rootAdded.dispose();
    this.slots.rootDeleted.dispose();
    this.slots.blockUpdated.dispose();

    if (this._docLoaded) {
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

  private _getYBlock(id: string): YBlock | null {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) return null;
    return yBlock;
  }

  private _historyObserver = () => {
    this.slots.historyUpdated.emit();
  };

  private _handleYBlockAdd(id: string) {
    const yBlock = this._getYBlock(id);
    if (!yBlock) {
      console.warn(
        `Failed to handle yBlock add, yBlock with id-${id} not found`
      );
      return;
    }

    this._onBlockAdded(id, {
      onChange: (block, key) => {
        block.model.propsUpdated.emit({ key });
      },
      onYBlockUpdated: block => {
        this.slots.blockUpdated.emit({
          type: 'update',
          id,
          flavour: block.flavour,
        });
      },
    });
    const block = this._blocks.get(id);
    assertExists(block);
    const model = block.model;
    model.page = this;

    const yChildren = yBlock.get('sys:children');
    if (yChildren instanceof Y.Array) {
      yChildren.forEach((id: string, index) => {
        const hasChild = this._blocks.has(id);

        if (!hasChild) {
          this._handleYBlockAdd(id);
        }

        model.children[index as number] = this.getBlockById(
          id
        ) as BaseBlockModel;
      });
    }

    if (model.role === 'root') {
      this._root = model;
      this.slots.rootAdded.emit(this._root);
      return;
    }

    this.slots.blockUpdated.emit({ type: 'add', id, flavour: model.flavour });
  }

  private _handleYBlockDelete(id: string) {
    const model = this.getBlockById(id);

    if (model === this._root) {
      this.slots.rootDeleted.emit(id);
    }
    assertExists(model);
    this.slots.blockUpdated.emit({
      type: 'delete',
      id,
      flavour: model.flavour,
      parent: this.getParent(model)?.id ?? '',
      model,
    });
    this._onBlockRemoved(id);
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target === this._yBlocks) {
      event.keys.forEach((value, id) => {
        if (value.action === 'add') {
          this._handleYBlockAdd(id);
        } else if (value.action === 'delete') {
          this._handleYBlockDelete(id);
        } else {
          // fires when undoing delete-and-add operation on a block
          // console.warn('update action on top-level block store', event);
        }
      });
    }
  }

  // Handle all the events that happen at _any_ level (potentially deep inside the structure).
  // So, we apply a listener at the top level for the flat structure of the current
  // page/space container.
  private _handleYEvents = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
  };

  validateVersion() {
    this.workspace.meta.validateVersion(this.workspace);
  }

  private _handleVersion() {
    // Initialization from empty yDoc, indicating that the document is new.
    if (!this.workspace.meta.hasVersion) {
      this.workspace.meta.writeVersion(this.workspace);
    } else {
      // Initialization from existing yDoc, indicating that the document is loaded from storage.
      this.validateVersion();
    }
  }

  override async load(initFn?: () => void) {
    await super.load();
    if (!this._docLoaded) {
      this.trySyncFromExistingDoc();
    }

    if (initFn) {
      await initFn();
      this._ready = true;
      this.slots.ready.emit();
    }

    return this;
  }

  /** @deprecated use page.load() instead */
  async waitForLoaded() {
    await this.load();
  }
}
