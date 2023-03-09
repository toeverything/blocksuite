import type { BlockTag, TagSchema } from '@blocksuite/global/database';
import { debug } from '@blocksuite/global/debug';
import type { BlockModelProps } from '@blocksuite/global/types';
import { assertExists, matchFlavours, Slot } from '@blocksuite/global/utils';
import { uuidv4 } from 'lib0/random.js';
import * as Y from 'yjs';

import type { AwarenessStore } from '../awareness.js';
import { BaseBlockModel, internalPrimitives } from '../base.js';
import { Space, StackItem } from '../space.js';
import { Text } from '../text-adapter.js';
import type { IdGenerator } from '../utils/id-generator.js';
import {
  assertValidChildren,
  initInternalProps,
  syncBlockProps,
  toBlockProps,
} from '../utils/utils.js';
import type { BlockSuiteDoc } from '../yjs/index.js';
import { tryMigrate } from './migrations.js';
import type { PageMeta, Workspace } from './workspace.js';

export type YBlock = Y.Map<unknown>;
export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockProps = Record<string, any> & {
  id: string;
  flavour: string;
  text?: Text;
  children?: BaseBlockModel[];
};

export type PrefixedBlockProps = Record<string, unknown> & {
  'sys:id': string;
  'sys:flavour': string;
};

const isWeb = typeof window !== 'undefined';

function createChildMap(yChildIds: Y.Array<string>) {
  return new Map(yChildIds.map((child, index) => [child, index]));
}

export type PageData = {
  [key: string]: YBlock;
};

export class Page extends Space<PageData> {
  private _workspace: Workspace;
  private _idGenerator: IdGenerator;
  private _history!: Y.UndoManager;
  private _root: BaseBlockModel | BaseBlockModel[] | null = null;
  private _blockMap = new Map<string, BaseBlockModel>();
  private _synced = false;

  // TODO use schema
  private _ignoredKeys = new Set<string>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Object.keys(new BaseBlockModel(this, { id: null! }))
  );

  readonly slots = {
    historyUpdated: new Slot(),
    rootAdded: new Slot<BaseBlockModel | BaseBlockModel[]>(),
    rootDeleted: new Slot<string | string[]>(),
    textUpdated: new Slot<Y.YTextEvent>(),
    yUpdated: new Slot(),
    blockUpdated: new Slot<{
      type: 'add' | 'delete' | 'update';
      id: string;
    }>(),
  };

  constructor(
    workspace: Workspace,
    id: string,
    doc: BlockSuiteDoc,
    awarenessStore: AwarenessStore,
    idGenerator: IdGenerator = uuidv4
  ) {
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

  get meta() {
    return this.workspace.meta.getPageMeta(this.id) as PageMeta;
  }

  get tags() {
    assertExists(this.root);
    assertExists(this.root.flavour === 'affine:page');
    return this.root.tags as Y.Map<Y.Map<unknown>>;
  }

  get tagSchema() {
    assertExists(this.root);
    assertExists(this.root.flavour === 'affine:page');
    return this.root.tagSchema as Y.Map<unknown>;
  }

  get blobs() {
    return this.workspace.blobs;
  }

  /** key-value store of blocks */
  private get _yBlocks(): YBlocks {
    return this.origin;
  }

  get root() {
    const root = Array.isArray(this._root) ? this._root[0] : this._root;
    if (root && root.flavour !== 'affine:page') {
      console.error('data broken');
    }
    return root;
  }

  get surface() {
    return Array.isArray(this._root) ? this._root[1] : null;
  }

  /** @internal used for getting surface block elements for phasor */
  get ySurfaceContainer() {
    assertExists(this.surface);
    const ySurface = this._yBlocks.get(this.surface.id);
    if (ySurface?.has('elements')) {
      return ySurface.get('elements') as Y.Map<unknown>;
    } else {
      ySurface?.set('elements', new Y.Map());
      return ySurface?.get('elements') as Y.Map<unknown>;
    }
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

  get Text() {
    return Text;
  }

  undo = () => {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    this._history.undo();
  };

  redo = () => {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    this._history.redo();
  };

  /** Capture current operations to undo stack synchronously. */
  captureSync = () => {
    this._history.stopCapturing();
  };

  resetHistory = () => {
    this._history.clear();
  };

  updateBlockTag<Tag extends BlockTag>(id: BaseBlockModel['id'], tag: Tag) {
    const already = this.tags.has(id);
    let tags: Y.Map<unknown>;
    if (!already) {
      tags = new Y.Map();
    } else {
      tags = this.tags.get(id) as Y.Map<unknown>;
    }
    this.transact(() => {
      if (!already) {
        this.tags.set(id, tags);
      }
      // Related issue: https://github.com/yjs/yjs/issues/255
      const tagMap = new Y.Map();
      tagMap.set('schemaId', tag.schemaId);
      tagMap.set('value', tag.value);
      tags.set(tag.schemaId, tagMap);
    });
  }

  getBlockTagByTagSchema(
    model: BaseBlockModel,
    schema: TagSchema
  ): BlockTag | null {
    const tags = this.tags.get(model.id);
    const tagMap = (tags?.get(schema.id) as Y.Map<unknown>) ?? null;
    if (!tagMap) {
      return null;
    }
    return {
      schemaId: tagMap.get('schemaId') as string,
      value: tagMap.get('value') as unknown,
    };
  }

  getTagSchema(id: TagSchema['id']): TagSchema | null {
    return (this.tagSchema.get(id) ?? null) as TagSchema | null;
  }

  setTagSchema(schema: Omit<TagSchema, 'id'>): string {
    const id = this._idGenerator();
    this.transact(() => this.tagSchema.set(id, { ...schema, id }));
    return id;
  }

  getBlockById(id: string) {
    return this._blockMap.get(id) ?? null;
  }

  getBlockByFlavour(blockFlavour: string) {
    return [...this._blockMap.values()].filter(
      ({ flavour }) => flavour === blockFlavour
    );
  }

  getParentById(
    rootId: string,
    target: BaseBlockModel | string
  ): BaseBlockModel | null {
    const targetId = typeof target === 'string' ? target : target.id;
    if (rootId === targetId) return null;

    const root = this._blockMap.get(rootId);
    if (!root) return null;

    for (const [childId] of root.childMap) {
      if (childId === targetId) return root;

      const parent = this.getParentById(childId, target);
      if (parent !== null) return parent;
    }
    return null;
  }

  getParent(block: BaseBlockModel | string) {
    if (!this.root) return null;

    return this.getParentById(this.root.id, block);
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
    return this.workspace.flavourSchemaMap.get(flavour);
  }

  getInitialPropsMapByFlavour(flavour: string) {
    return this.workspace.flavourInitialPropsMap.get(flavour);
  }

  @debug('CRUD')
  public addBlocksByFlavour<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ALLProps extends Record<string, any> = BlockModelProps,
    Flavour extends keyof ALLProps & string = keyof ALLProps & string
  >(
    blocks: Array<{
      flavour: Flavour;
      blockProps?: Partial<
        ALLProps[Flavour] &
          Omit<BlockSuiteInternal.IBaseBlockProps, 'flavour' | 'id'>
      >;
    }>,
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ): string[] {
    const ids: string[] = [];
    blocks.forEach(block => {
      const id = this.addBlockByFlavour<ALLProps, Flavour>(
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
  public addBlockByFlavour<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ALLProps extends Record<string, any> = BlockModelProps,
    Flavour extends keyof ALLProps & string = keyof ALLProps & string
  >(
    flavour: Flavour,
    blockProps: Partial<
      ALLProps[Flavour] &
        Omit<BlockSuiteInternal.IBaseBlockProps, 'flavour' | 'id'>
    > = {},
    parent?: BaseBlockModel | string | null,
    parentIndex?: number
  ): string {
    if (this.readonly) {
      throw new Error('cannot modify data in readonly mode');
    }
    if (!flavour) {
      throw new Error('Block props must contain flavour');
    }
    if (
      !this.awarenessStore.getFlag('enable_database') &&
      flavour === 'affine:database'
    ) {
      throw new Error('database is not enabled');
    }

    const clonedProps: Partial<BlockProps> = { flavour, ...blockProps };
    const id = this._idGenerator();
    clonedProps.id = id;

    this.transact(() => {
      const yBlock = new Y.Map() as YBlock;
      // set the yBlock at the very beginning, otherwise yBlock will be always empty
      this._yBlocks.set(id, yBlock);

      assertValidChildren(this._yBlocks, clonedProps);
      initInternalProps(yBlock, clonedProps);
      const defaultProps = this.workspace.flavourInitialPropsMap.get(flavour);
      assertExists(defaultProps);
      const schema = this.getSchemaByFlavour(flavour);
      assertExists(schema);
      syncBlockProps(
        schema,
        defaultProps,
        yBlock,
        clonedProps,
        this._ignoredKeys
      );

      if (typeof parent === 'string') {
        parent = this._blockMap.get(parent);
      }

      const parentId = parent === null ? null : parent?.id ?? this.root?.id;

      if (parentId) {
        const yParent = this._yBlocks.get(parentId) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;
        const index = parentIndex ?? yChildren.length;
        yChildren.insert(index, [id]);
      }
    });

    this.slots.blockUpdated.emit({
      type: 'add',
      id,
    });

    return id;
  }

  updateBlockById(id: string, props: Partial<BlockProps>) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    const model = this._blockMap.get(id) as BaseBlockModel;
    this.updateBlock(model, props);
  }

  @debug('CRUD')
  moveBlocks(
    blocks: BaseBlockModel[],
    targetModel: BaseBlockModel,
    top = true
  ) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }

    const firstBlock = blocks[0];
    const currentParentModel = this.getParent(firstBlock);

    // the blocks must have the same parent (siblings)
    if (blocks.some(block => this.getParent(block) !== currentParentModel)) {
      console.error('the blocks must have the same parent');
    }

    const nextParentModel = this.getParent(targetModel);
    if (currentParentModel === null || nextParentModel === null) {
      throw new Error('cannot find parent model');
    }

    this.transact(() => {
      const yParentA = this._yBlocks.get(currentParentModel.id) as YBlock;
      const yChildrenA = yParentA.get('sys:children') as Y.Array<string>;
      const idx = yChildrenA.toArray().findIndex(id => id === firstBlock.id);
      yChildrenA.delete(idx, blocks.length);
      const yParentB = this._yBlocks.get(nextParentModel.id) as YBlock;
      const yChildrenB = yParentB.get('sys:children') as Y.Array<string>;
      const nextIdx = yChildrenB
        .toArray()
        .findIndex(id => id === targetModel.id);

      const ids = blocks.map(block => block.id);
      if (top) {
        yChildrenB.insert(nextIdx, ids);
      } else {
        yChildrenB.insert(nextIdx + 1, ids);
      }
    });
    currentParentModel.propsUpdated.emit();
    nextParentModel.propsUpdated.emit();
  }

  @debug('CRUD')
  updateBlock<T extends Partial<BlockProps>>(model: BaseBlockModel, props: T) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    const yBlock = this._yBlocks.get(model.id) as YBlock;

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

      const defaultProps = this.workspace.flavourInitialPropsMap.get(
        model.flavour
      );
      assertExists(defaultProps);
      const schema = this.workspace.flavourSchemaMap.get(model.flavour);
      assertExists(schema);
      syncBlockProps(schema, defaultProps, yBlock, props, this._ignoredKeys);
    });

    this.slots.blockUpdated.emit({
      type: 'update',
      id: model.id,
    });
  }

  addSiblingBlocks(
    targetModel: BaseBlockModel,
    props: Array<Partial<BaseBlockModel>>,
    place: 'after' | 'before' = 'after'
  ): string[] {
    const parent = this.getParent(targetModel);
    assertExists(parent);

    const targetIndex =
      parent?.children.findIndex(({ id }) => id === targetModel.id) ?? 0;
    const insertIndex = place === 'before' ? targetIndex : targetIndex + 1;

    if (props.length > 1) {
      const blocks: Array<{
        flavour: keyof BlockModelProps;
        blockProps: Partial<
          BlockModelProps &
            Omit<BlockSuiteInternal.IBaseBlockProps, 'id' | 'flavour'>
        >;
      }> = [];
      props.forEach(prop => {
        const { flavour, ...blockProps } = prop;
        assertExists(flavour);
        blocks.push({ flavour, blockProps });
      });
      const ids = this.addBlocksByFlavour(blocks, parent.id, insertIndex);
      return ids;
    } else {
      assertExists(props[0].flavour);
      const { flavour, ...blockProps } = props[0];
      const id = this.addBlockByFlavour(
        flavour,
        blockProps,
        parent.id,
        insertIndex
      );
      return [id];
    }
  }

  deleteBlockById(id: string) {
    if (this.readonly) {
      console.error('cannot modify data in readonly mode');
      return;
    }
    const model = this._blockMap.get(id) as BaseBlockModel;
    this.deleteBlock(model);
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
    if (index > -1) {
      parent?.children.splice(parent.children.indexOf(model), 1);
    }
    if (options.bringChildrenTo === 'parent' && parent) {
      parent.children.unshift(...model.children);
    } else if (options.bringChildrenTo instanceof BaseBlockModel) {
      options.bringChildrenTo.children.unshift(...model.children);
    }
    this._blockMap.delete(model.id);

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
        if (options.bringChildrenTo === 'parent' && parent) {
          yChildren.unshift(children);
        } else if (options.bringChildrenTo instanceof BaseBlockModel) {
          this.updateBlockById(options.bringChildrenTo.id, {
            children: options.bringChildrenTo.children,
          });
        }
      }
    });

    this.slots.blockUpdated.emit({
      type: 'delete',
      id: model.id,
    });
  }

  syncFromExistingDoc() {
    if (this._synced) {
      throw new Error('Cannot sync from existing doc more than once');
    }

    tryMigrate(this.doc);

    this._handleVersion();
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
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
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

  private _createBlockModel(props: Omit<BlockProps, 'children'>) {
    const schema = this.workspace.flavourSchemaMap.get(props.flavour);
    if (!schema) {
      throw new Error(`Block flavour ${props.flavour} is not registered`);
    } else if (!props.id) {
      throw new Error('Block id is not defined');
    }
    const blockModel = new BaseBlockModel(
      this,
      props as PropsWithId<Omit<BlockProps, 'children'>>
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockModel.flavour = schema.model.flavour as any;
    blockModel.tag = schema.model.tag;
    const modelProps = schema.model.props(internalPrimitives);
    Object.entries(modelProps).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (blockModel as any)[key] = props[key] ?? value;
    });
    return blockModel;
  }

  private _handleYBlockAdd(visited: Set<string>, id: string) {
    const yBlock = this._getYBlock(id);
    let isRoot = false;
    let isSurface = false;

    const props = toBlockProps(yBlock) as BlockProps;
    const model = this._createBlockModel({ ...props, id });
    if (model.flavour === 'affine:surface') {
      isSurface = true;
    }
    if (model.flavour === 'affine:page') {
      isRoot = true;
    }
    this._blockMap.set(props.id, model);

    const initialProps = this.workspace.flavourInitialPropsMap.get(
      model.flavour
    );
    assertExists(initialProps);
    Object.entries(initialProps).forEach(([key, value]) => {
      if (value instanceof Text) {
        const yText = yBlock.get(`prop:${key}`) as Y.Text;
        Object.assign(model, { [key]: new Text(yText) });
      }
    });

    if (matchFlavours(model, ['affine:page'] as const)) {
      model.tags = yBlock.get('meta:tags') as Y.Map<Y.Map<unknown>>;
      model.tagSchema = yBlock.get('meta:tagSchema') as Y.Map<unknown>;

      const titleText = yBlock.get('prop:title') as Y.Text;
      model.title = new Text(titleText);
    }

    // TODO use schema
    if (model.flavour === 'affine:database') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (model as any).columns = (
        yBlock.get('prop:columns') as Y.Array<unknown>
      ).toArray();
    }

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

          const child = this._blockMap.get(id) as BaseBlockModel;
          model.children[index as number] = child;
        }
      });
    }

    if (isRoot) {
      this._root = model;
      this.slots.rootAdded.emit(model);
    } else if (isSurface) {
      this._root = [this.root as BaseBlockModel, model];
      this.slots.rootAdded.emit(this._root);
    } else {
      const parent = this.getParent(model);
      const index = parent?.childMap.get(model.id);
      if (parent && index !== undefined) {
        parent.children[index] = model;
        parent.childrenUpdated.emit();
      }
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
      if (value instanceof Y.Array) {
        props[key.replace('prop:', '')] = value.toArray();
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
    } else {
      if (event.path.includes('meta:tags')) {
        // todo: refactor here
        const blockId = event.path[2] as string;
        const block = this.getBlockById(blockId);
        assertExists(block);
        block.propsUpdated.emit();
      }
    }
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
    if (this._yBlocks.size === 0) {
      this.workspace.meta.writeVersion(this.workspace);
    }
    // Initialization from existing yDoc, indicating that the document is loaded from storage.
    else {
      this.workspace.meta.validateVersion(this.workspace);
    }
  }
}
