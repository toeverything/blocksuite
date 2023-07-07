import type { SerializedBlock } from '@blocksuite/blocks';
import { debug } from '@blocksuite/global/debug';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import type { AwarenessStore } from '../awareness.js';
import { BaseBlockModel, internalPrimitives } from '../base.js';
import { Space, type StackItem } from '../space.js';
import { Text } from '../text-adapter.js';
import type { IdGenerator } from '../utils/id-generator.js';
import {
  assertValidChildren,
  initInternalProps,
  syncBlockProps,
  toBlockProps,
} from '../utils/utils.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import type { PageMeta } from './meta.js';
import type { Workspace } from './workspace.js';

export type YBlock = Y.Map<unknown>;
export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
export type BlockProps = {
  id: string;
  flavour: string;
  text?: Text;
  children?: BaseBlockModel[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;
};

export type PrefixedBlockProps = Record<string, unknown> & {
  'sys:id': string;
  'sys:flavour': string;
};

const isWeb = typeof window !== 'undefined';

function createChildMap(yChildIds: Y.Array<string>) {
  return new Map(yChildIds.map((child, index) => [child, index]));
}

type FlatBlockMap = {
  [key: string]: YBlock;
};

type PageOptions = {
  id: string;
  workspace: Workspace;
  doc: BlockSuiteDoc;
  awarenessStore: AwarenessStore;
  idGenerator?: IdGenerator;
};

export class Page extends Space<FlatBlockMap> {
  private readonly _workspace: Workspace;
  private readonly _idGenerator: IdGenerator;
  private _history!: Y.UndoManager;
  private _root: BaseBlockModel | null = null;
  private _blockMap = new Map<string, BaseBlockModel>();
  private _synced = false;
  private _shouldTransact = true;

  // TODO use schema
  private _ignoredKeys = new Set<string>(Object.keys(new BaseBlockModel()));

  readonly slots = {
    historyUpdated: new Slot(),
    rootAdded: new Slot<BaseBlockModel>(),
    rootDeleted: new Slot<string | string[]>(),
    textUpdated: new Slot<Y.YTextEvent>(),
    yUpdated: new Slot(),
    onYEvent: new Slot<{
      event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>;
    }>(),
    blockUpdated: new Slot<
      | {
          type: 'add' | 'delete';
          id: string;
        }
      | {
          type: 'update';
          id: string;
          props: Partial<BlockProps>;
        }
    >(),
    copied: new Slot(),
    pasted: new Slot<SerializedBlock[]>(),
  };

  constructor({
    id,
    workspace,
    doc,
    awarenessStore,
    idGenerator = uuidv4,
  }: PageOptions) {
    super(id, doc, awarenessStore);
    this._workspace = workspace;
    this._idGenerator = idGenerator;
  }

  get readonly() {
    return this.awarenessStore.isReadonly(this);
  }

  get history() {
    return this._history;
  }

  get workspace() {
    return this._workspace;
  }

  get schema() {
    return this._workspace.schema;
  }

  get meta() {
    return this.workspace.meta.getPageMeta(this.id) as PageMeta;
  }

  get blobs() {
    return this.workspace.blobs;
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

  get YText() {
    return Y.Text;
  }

  get YMap() {
    return Y.Map;
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

  generateId() {
    return this._idGenerator();
  }

  getBlockById(id: string) {
    return this._blockMap.get(id) ?? null;
  }

  getBlockByFlavour(blockFlavour: string) {
    return [...this._blockMap.values()].filter(
      ({ flavour }) => flavour === blockFlavour
    );
  }

  hasFlavour(flavour: string) {
    return this.getBlockByFlavour(flavour).length > 0;
  }

  getParent(target: BaseBlockModel | string): BaseBlockModel | null {
    const root = this._root;
    const targetId = typeof target === 'string' ? target : target.id;
    if (!root || root.id === targetId) return null;

    const findParent = (parentId: string): BaseBlockModel | null => {
      const parentModel = this._blockMap.get(parentId);
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

  @debug('CRUD')
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

  @debug('CRUD')
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

    const clonedProps: Partial<BlockProps> = { flavour, ...blockProps };
    const id = blockProps.id ?? this._idGenerator();
    clonedProps.id = id;

    this.transact(() => {
      const yBlock = new Y.Map() as YBlock;
      // set the yBlock at the very beginning, otherwise yBlock will be always empty
      this._yBlocks.set(id, yBlock);

      assertValidChildren(this._yBlocks, clonedProps);
      const schema = this.getSchemaByFlavour(flavour);
      assertExists(schema);

      initInternalProps(yBlock, clonedProps);
      syncBlockProps(schema, yBlock, clonedProps, this._ignoredKeys);

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

    this.slots.blockUpdated.emit({ type: 'add', id });

    return id;
  }

  private _populateParentChildrenMap(
    blocksToMove: BaseBlockModel[],
    childBlocksPerParent: Map<BaseBlockModel, BaseBlockModel[]>,
    newParent: BaseBlockModel
  ) {
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
  }

  private _repositionBlocks(
    childBlocksPerParent: Map<BaseBlockModel, BaseBlockModel[]>,
    targetParentChildren: Y.Array<string>,
    targetSibling: BaseBlockModel | null,
    shouldInsertBeforeSibling: boolean,
    insertionOffset: number
  ) {
    for (const [parentBlock, blocksToMove] of childBlocksPerParent) {
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

      // Determine the index at which to insert blocks in the new parent
      let insertIndex = 0;
      if (targetSibling) {
        insertIndex = targetParentChildren
          .toArray()
          .findIndex(id => id === targetSibling.id);
      }

      // Insert the blocks at the correct position under their new parent
      if (shouldInsertBeforeSibling) {
        targetParentChildren.insert(insertIndex, idsOfBlocksToMove);
      } else {
        targetParentChildren.insert(
          insertIndex + insertionOffset,
          idsOfBlocksToMove
        );
        insertionOffset += idsOfBlocksToMove.length;
      }
    }
  }

  // Moves blocks to a new parent. Optionally inserts blocks before a given sibling.
  @debug('CRUD')
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

    this._populateParentChildrenMap(
      blocksToMove,
      childBlocksPerParent,
      newParent
    );

    this.transact(() => {
      const targetParentBlock = this._yBlocks.get(newParent.id) as YBlock;
      const targetParentChildren = targetParentBlock.get(
        'sys:children'
      ) as Y.Array<string>;

      // To be used for insertion after the target sibling
      const insertionOffset = 1;

      // Reposition blocks under their new parent
      this._repositionBlocks(
        childBlocksPerParent,
        targetParentChildren,
        targetSibling,
        shouldInsertBeforeSibling,
        insertionOffset
      );
    });

    // Emit event to indicate that the children of these blocks have been updated
    Array.from(childBlocksPerParent.keys()).forEach(parent =>
      parent.childrenUpdated.emit()
    );

    newParent.childrenUpdated.emit();
  }

  @debug('CRUD')
  updateBlock<T extends Partial<BlockProps>>(model: BaseBlockModel, props: T) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const parent = this.getParent(model);
    this.schema.validate(
      model.flavour,
      parent?.flavour,
      props.children?.map(child => child.flavour)
    );

    const yBlock = this._yBlocks.get(model.id);
    assertExists(yBlock);

    this.transact(() => {
      // TODO diff children changes
      // All child nodes will be deleted in the current behavior, then added again.
      // Through diff children changes, the experience can be improved.
      if (props.children) {
        const yChildren = new Y.Array<string>();
        yChildren.insert(
          0,
          props.children.map(child => child.id)
        );
        yBlock.set('sys:children', yChildren);
      }

      const schema = this.schema.flavourSchemaMap.get(model.flavour);
      assertExists(schema);
      syncBlockProps(schema, yBlock, props, this._ignoredKeys);
    });

    model.propsUpdated.emit();

    this.slots.blockUpdated.emit({
      type: 'update',
      id: model.id,
      props,
    });
  }

  addSiblingBlocks(
    targetModel: BaseBlockModel,
    props: Array<Partial<BaseBlockModel>>,
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
        blockProps: Partial<BlockProps & Omit<BlockProps, 'id' | 'flavour'>>;
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

  @debug('CRUD')
  deleteBlock(
    model: BaseBlockModel,
    options: {
      bringChildrenTo: 'parent' | BaseBlockModel | false;
    } = {
      bringChildrenTo: false,
    }
  ) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    const parent = this.getParent(model);
    const index = parent?.children.indexOf(model) ?? -1;
    const { bringChildrenTo } = options;
    if (index > -1) {
      parent?.children.splice(parent.children.indexOf(model), 1);
    }
    if (bringChildrenTo === 'parent' && parent) {
      model.children.forEach(child => {
        this.schema.validate(child.flavour, parent.flavour);
      });
      parent.children.unshift(...model.children);
    } else if (bringChildrenTo instanceof BaseBlockModel) {
      model.children.forEach(child => {
        this.schema.validate(child.flavour, bringChildrenTo.flavour);
      });
      // When bring children to parent, insert children to the original position of model
      if (bringChildrenTo === parent && index > -1) {
        parent.children.splice(index, 0, ...model.children);
      } else {
        bringChildrenTo.children.push(...model.children);
      }
    }
    this._blockMap.delete(model.id);

    model.propsUpdated.emit();

    this.transact(() => {
      this._yBlocks.delete(model.id);
      const children = model.children.map(model => model.id);
      model.dispose();

      if (parent) {
        const yParent = this._yBlocks.get(parent.id) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;

        if (index > -1) {
          yChildren.delete(index, 1);
        }
        if (options.bringChildrenTo === 'parent') {
          yChildren.unshift(children);
        } else if (options.bringChildrenTo instanceof BaseBlockModel) {
          this.updateBlock(options.bringChildrenTo, {
            children: options.bringChildrenTo.children,
          });
        }
      }
    });

    this.slots.blockUpdated.emit({ type: 'delete', id: model.id });
  }

  trySyncFromExistingDoc() {
    if (this._synced) {
      throw new Error('Cannot sync from existing doc more than once');
    }

    if ((this.workspace.meta.pages?.length ?? 0) <= 1) {
      // tryMigrate(this.doc);
      this._handleVersion();
    }

    this._initYBlocks();

    const visited = new Set<string>();

    this._yBlocks.forEach((_, id) => {
      if (visited.has(id)) return;
      visited.add(id);
      this._handleYBlockAdd(visited, id);
    });

    this._synced = true;
  }

  dispose() {
    this.slots.historyUpdated.dispose();
    this.slots.rootAdded.dispose();
    this.slots.rootDeleted.dispose();
    this.slots.textUpdated.dispose();
    this.slots.yUpdated.dispose();
    this.slots.blockUpdated.dispose();
    this.slots.onYEvent.dispose();

    this._yBlocks.unobserveDeep(this._handleYEvents);
    this._yBlocks.clear();
  }

  private _initYBlocks() {
    const { _yBlocks } = this;
    // Consider if we need to expose the ability to temporarily unobserve this._yBlocks.
    // "unobserve" is potentially necessary to make sure we don't create
    // an infinite loop when sync to remote then back to client.
    // `action(a) -> YDoc' -> YEvents(a) -> YRemoteDoc' -> YEvents(a) -> YDoc'' -> ...`
    // We could unobserve in order to short circuit by ignoring the sync of remote
    // events we actually generated locally.
    // _yBlocks.unobserveDeep(this._handleYEvents);
    _yBlocks.observeDeep(this._handleYEvents);
    this._history = new Y.UndoManager([_yBlocks], {
      trackedOrigins: new Set([this._ySpaceDoc.clientID]),
    });

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyAddObserver);
    this._history.on('stack-item-popped', this._historyPopObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  private _getYBlock(id: string): YBlock {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      throw new Error(`Block with id ${id} does not exist`);
    }
    return yBlock;
  }

  private _historyAddObserver = (event: { stackItem: StackItem }) => {
    if (isWeb) {
      event.stackItem.meta.set(
        'cursor-location',
        this.awarenessStore.getLocalRange(this)
      );
    }

    this._historyObserver();
  };

  private _historyPopObserver = (event: { stackItem: StackItem }) => {
    const range = event.stackItem.meta.get('cursor-location');
    if (!range) {
      return;
    }

    this.awarenessStore.setLocalRange(this, range);
    this._historyObserver();
  };

  private _historyObserver = () => {
    this.slots.historyUpdated.emit();
  };

  private _createBlockModel(
    props: Omit<BlockProps, 'children'>,
    block: YBlock
  ) {
    const schema = this.schema.flavourSchemaMap.get(props.flavour);
    if (!schema) {
      throw new Error(`Block flavour ${props.flavour} is not registered`);
    } else if (!props.id) {
      throw new Error('Block id is not defined');
    }
    const blockModel = schema.model.toModel
      ? schema.model.toModel()
      : new BaseBlockModel();

    blockModel.id = props.id;
    const modelProps = schema.model.props?.(internalPrimitives) ?? {};
    Object.entries(modelProps).forEach(([key, value]) => {
      // @ts-ignore
      blockModel[key] =
        value instanceof Text
          ? new Text(block.get(`prop:${key}`) as Y.Text)
          : props[key] ?? value;
    });
    blockModel.page = this;
    blockModel.yBlock = block;
    blockModel.flavour = schema.model.flavour;
    blockModel.role = schema.model.role;

    blockModel.onCreated();

    return blockModel;
  }

  private _handleYBlockAdd(visited: Set<string>, id: string) {
    const yBlock = this._getYBlock(id);

    const props = toBlockProps(yBlock, this.doc);
    const model = this._createBlockModel({ ...props, id }, yBlock);
    this._blockMap.set(id, model);

    const yChildren = yBlock.get('sys:children');
    if (yChildren instanceof Y.Array) {
      model.childMap = createChildMap(yChildren);

      yChildren.forEach((id: string) => {
        const index = model.childMap.get(id);
        if (Number.isInteger(index)) {
          const hasChild = this._blockMap.has(id);

          if (!hasChild) {
            visited.add(id);
            this._handleYBlockAdd(visited, id);
          }

          model.children[index as number] = this._blockMap.get(
            id
          ) as BaseBlockModel;
        }
      });
    }

    if (model.role === 'root') {
      this._root = model;
      this.slots.rootAdded.emit(this._root);
      return;
    }

    const parent = this.getParent(model);
    const index = parent?.childMap.get(model.id);
    if (parent && index !== undefined) {
      parent.children[index] = model;
      parent.childrenUpdated.emit();
    }
  }

  private _handleYBlockDelete(id: string) {
    const model = this._blockMap.get(id);
    if (model === this._root) {
      this.slots.rootDeleted.emit(id);
    } else {
      // TODO dispatch model delete event
    }
    this._blockMap.delete(id);
  }

  private _handleYBlockUpdate(event: Y.YMapEvent<unknown>) {
    const id = event.target.get('sys:id') as string;
    const model = this.getBlockById(id);
    if (!model) return;

    const props: Partial<BlockProps> = {};
    let hasPropsUpdate = false;
    let hasChildrenUpdate = false;
    for (const key of event.keysChanged) {
      // TODO use schema
      if (key === 'prop:text') continue;
      // Update children
      if (key === 'sys:children') {
        hasChildrenUpdate = true;
        const yChildren = event.target.get('sys:children');
        if (!(yChildren instanceof Y.Array)) {
          console.error(
            'Failed to update block children!, sys:children is not an Y array',
            event,
            yChildren
          );
          continue;
        }
        model.childMap = createChildMap(yChildren);
        model.children = yChildren.map(
          id => this._blockMap.get(id) as BaseBlockModel
        );
        continue;
      }
      const value = event.target.get(key);
      hasPropsUpdate = true;
      if (value instanceof Y.Map || value instanceof Y.Array) {
        props[key.replace('prop:', '')] = this.doc.proxy.createYProxy(value, {
          deep: true,
        });
      } else {
        props[key.replace('prop:', '')] = value;
      }
    }

    if (hasPropsUpdate) {
      Object.assign(model, props);
      model.propsUpdated.emit();
    }
    hasChildrenUpdate && model.childrenUpdated.emit();
  }

  private _handleYEvent(event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>) {
    // event on top-level block store
    if (event.target === this._yBlocks) {
      const visited = new Set<string>();

      event.keys.forEach((value, id) => {
        if (value.action === 'add') {
          // Here the key is the id of the blocks.
          // Generally, the key that appears earlier corresponds to the block added earlier,
          // and it won't refer to subsequent keys.
          // However, when redo the operation that adds multiple blocks at once,
          // the earlier block may have children pointing to subsequent blocks.
          // In this case, although the yjs-side state is correct, the BlockModel instance may not exist yet.
          // Therefore, at this point we synchronize the referenced block first,
          // then mark it in `visited` so that they can be skipped.
          if (visited.has(id)) return;
          visited.add(id);

          this._handleYBlockAdd(visited, id);
        } else if (value.action === 'delete') {
          this._handleYBlockDelete(id);
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
      } else if (event instanceof Y.YMapEvent) {
        this._handleYBlockUpdate(event);
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
          model.children = childIds.map(
            id => this._blockMap.get(id) as BaseBlockModel
          );
          model.childMap = createChildMap(event.target);
          model.childrenUpdated.emit();
        }
      }
    }

    this.slots.onYEvent.emit({ event });
  }

  // Handle all the events that happen at _any_ level (potentially deep inside the structure).
  // So, we apply a listener at the top level for the flat structure of the current
  // page/space container.
  private _handleYEvents = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
    this.slots.yUpdated.emit();
  };

  private _handleVersion() {
    // Initialization from empty yDoc, indicating that the document is new.
    if (!this.workspace.meta.hasVersion) {
      this.workspace.meta.writeVersion(this.workspace);
    }
    // Initialization from existing yDoc, indicating that the document is loaded from storage.
    else {
      this.workspace.meta.validateVersion(this.workspace);
    }
  }

  override async waitForLoaded() {
    await super.waitForLoaded();
    if (!this._synced) {
      this.trySyncFromExistingDoc();
    }

    return this;
  }
}
