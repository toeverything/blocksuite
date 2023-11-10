import { assertExists, Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import type { BaseBlockModel } from '../schema/base.js';
import { internalPrimitives } from '../schema/base.js';
import type { IdGenerator } from '../utils/id-generator.js';
import {
  assertValidChildren,
  initSysProps,
  schemaToModel,
  syncBlockProps,
  toBlockProps,
  valueToProps,
} from '../utils/utils.js';
import type { AwarenessStore } from '../yjs/awareness.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import { Text } from '../yjs/text-adapter.js';
import type { PageMeta } from './meta.js';
import { Space } from './space.js';
import type { Workspace } from './workspace.js';

export type YBlock = Y.Map<unknown>;
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
  private _initialized = false;
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
    textUpdated: new Slot<Y.YTextEvent>(),
    yUpdated: new Slot(),
    onYEvent: new Slot<{
      event: Y.YEvent<YBlock | Y.Text | Y.Array<unknown>>;
    }>(),
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
        }
      | {
          type: 'update';
          id: string;
          flavour: string;
          props: Partial<BlockProps>;
        }
    >(),
    yBlockUpdated: new Slot<{
      id: string;
      type: 'add' | 'update' | 'delete';
      props: { [key: string]: { old: unknown; new: unknown } };
    }>(),
    copied: new Slot(),
    pasted: new Slot<Record<string, unknown>[]>(),
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
    return this._blockMap.get(id) ?? null;
  }

  getBlockByFlavour(blockFlavour: string | string[]) {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return Array.from(this._blockMap.values()).filter(({ flavour }) =>
      flavours.includes(flavour)
    );
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
      const yBlock = new Y.Map() as YBlock;
      // set the yBlock at the very beginning, otherwise yBlock will be always empty
      this._yBlocks.set(id, yBlock);

      assertValidChildren(this._yBlocks, clonedProps);
      const schema = this.getSchemaByFlavour(flavour);
      assertExists(schema);

      initSysProps(yBlock, clonedProps);
      syncBlockProps(schema, yBlock, clonedProps);

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

    const oldProps = toBlockProps(yBlock, this.doc.proxy);

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
      syncBlockProps(schema, yBlock, props);
    });

    const newProps = toBlockProps(yBlock, this.doc.proxy);

    model.propsUpdated.emit({
      oldProps,
      newProps,
    });

    this.slots.blockUpdated.emit({
      type: 'update',
      flavour: model.flavour,
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

            this._yBlocks.delete(id);
          };

          yModelChildren.forEach(id => {
            dl(id);
          });
        }
      }

      this._yBlocks.delete(model.id);

      parent.childrenUpdated.emit();
    });
  }

  trySyncFromExistingDoc() {
    if (this._initialized) {
      throw new Error('Cannot sync from existing doc more than once');
    }

    if ((this.workspace.meta.pages?.length ?? 0) <= 1) {
      this._handleVersion();
    }

    this._initYBlocks();

    const visited = new Set<string>();

    this._yBlocks.forEach((_, id) => {
      if (visited.has(id)) return;
      visited.add(id);
      this._handleYBlockAdd(visited, id);
    });

    this._initialized = true;
    this.slots.ready.emit();
  }

  dispose() {
    this.slots.historyUpdated.dispose();
    this.slots.rootAdded.dispose();
    this.slots.rootDeleted.dispose();
    this.slots.textUpdated.dispose();
    this.slots.yUpdated.dispose();
    this.slots.blockUpdated.dispose();
    this.slots.onYEvent.dispose();

    if (this._initialized) {
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

  private _createBlockModel(id: string, flavour: string, block: YBlock) {
    const schema = this.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Block flavour ${flavour} is not registered`);
    assertExists(id, 'Block id is not defined');

    const model = schemaToModel(id, schema, block, this);
    model.created.emit();

    return model;
  }

  private _handleYBlockAdd(visited: Set<string>, id: string) {
    const yBlock = this._getYBlock(id);
    if (!yBlock) {
      console.warn(
        `Failed to handle yBlock add, yBlock with id-${id} not found`
      );
      return;
    }

    const flavour = yBlock.get('sys:flavour') as string;
    const model = this._createBlockModel(id, flavour, yBlock);
    this._blockMap.set(id, model);

    const yChildren = yBlock.get('sys:children');
    if (yChildren instanceof Y.Array) {
      model.childMap = createChildMap(yChildren);

      yChildren.forEach((id: string) => {
        const index = model.childMap.get(id);
        assertExists(index);
        const hasChild = this._blockMap.has(id);

        if (!hasChild) {
          visited.add(id);
          this._handleYBlockAdd(visited, id);
        }

        model.children[index as number] = this._blockMap.get(
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
    const model = this._blockMap.get(id);

    if (model === this._root) {
      this.slots.rootDeleted.emit(id);
    }
    assertExists(model);
    this.slots.blockUpdated.emit({
      type: 'delete',
      id,
      flavour: model.flavour,
      parent: this.getParent(model)?.id ?? '',
    });
    model.deleted.emit();
    model.dispose();
    this._blockMap.delete(id);
  }

  private _handleYBlockUpdate(event: Y.YMapEvent<unknown>) {
    const yMap = event.target;
    const id = yMap.get('sys:id') as string;
    const model = this.getBlockById(id);
    if (!model) return;

    const oldProps = toBlockProps(yMap, this.doc.proxy);

    const props: Partial<BlockProps> = {};
    const yProps: { [key: string]: { old: unknown; new: unknown } } = {};
    let hasPropsUpdate = false;
    let hasChildrenUpdate = false;
    event.keysChanged.forEach(prefixedKey => {
      // Update children
      if (prefixedKey === 'sys:children') {
        hasChildrenUpdate = true;
        const yChildren = event.target.get('sys:children');
        if (!(yChildren instanceof Y.Array)) {
          console.error(
            'Failed to update block children!, sys:children is not an Y array',
            event,
            yChildren
          );
          return;
        }
        model.childMap = createChildMap(yChildren);
        model.children = yChildren.map(
          id => this._blockMap.get(id) as BaseBlockModel
        );
        return;
      }

      const key = prefixedKey.replace('prop:', '');
      const value = yMap.get(prefixedKey);
      const newVal = valueToProps(value, this.doc.proxy);
      const oldVal = event.changes.keys.get(prefixedKey)?.oldValue;
      yProps[prefixedKey] = { old: oldVal, new: newVal };
      hasPropsUpdate = true;
      props[key] = newVal;
    });

    if (hasPropsUpdate) {
      Object.assign(model, props);
      model.propsUpdated.emit({
        oldProps: oldProps,
        newProps: toBlockProps(yMap, this.doc.proxy),
      });
      this.slots.yBlockUpdated.emit({
        id: model.id,
        props: yProps,
        type: 'update',
      });
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

  override async waitForLoaded() {
    await super.waitForLoaded();
    if (!this._initialized) {
      this.trySyncFromExistingDoc();
    }

    return this;
  }
}
