import type Quill from 'quill';
import { Awareness } from 'y-protocols/awareness.js';
import * as Y from 'yjs';
import { AwarenessAdapter, SelectionRange } from './awareness';
import { BaseBlockModel } from './base';
import { PrelimText, RichTextAdapter, Text, TextType } from './text-adapter';
import { Signal } from './utils/signal';
import {
  assertValidChildren,
  initSysProps,
  matchFlavours,
  syncBlockProps,
  toBlockProps,
  trySyncTextProp,
} from './utils/utils';
import { uuidv4 } from './utils/id-generator';
import type { IdGenerator } from './utils/id-generator';

export type YBlock = Y.Map<unknown>;
export type YBlocks = Y.Map<YBlock>;

/** JSON-serializable properties of a block */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockProps = Record<string, any> & {
  id: string;
  flavour: string;
  text?: void | TextType;
  children?: BaseBlockModel[];
};

export type PrefixedBlockProps = Record<string, unknown> & {
  'sys:id': string;
  'sys:flavour': string;
};

export interface StackItem {
  meta: Map<'cursor-location', SelectionRange | undefined>;
  type: 'undo' | 'redo';
}

// Workaround
const IS_WEB = typeof window !== 'undefined';

function createChildMap(yChildIds: Y.Array<string>) {
  return new Map(yChildIds.map((child, index) => [child, index]));
}

export class Space<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IBlockSchema extends Record<string, typeof BaseBlockModel> = any
> {
  readonly id: string;
  readonly doc: Y.Doc;
  readonly awareness!: AwarenessAdapter;
  readonly richTextAdapters = new Map<string, RichTextAdapter>();

  readonly signals = {
    historyUpdated: new Signal(),
    rootAdded: new Signal<BaseBlockModel>(),
    rootDeleted: new Signal<string>(),
    textUpdated: new Signal<Y.YTextEvent>(),
    updated: new Signal(),
  };

  private _idGenerator: IdGenerator;
  private _history: Y.UndoManager;
  private _root: BaseBlockModel | null = null;
  private _flavourMap = new Map<string, IBlockSchema[keyof IBlockSchema]>();
  private _blockMap = new Map<
    string,
    InstanceType<IBlockSchema[keyof IBlockSchema]>
  >();
  private _splitSet = new Set<Text | PrelimText>();

  // TODO use schema
  private _ignoredKeys: Set<
    keyof InstanceType<IBlockSchema[keyof IBlockSchema]> & string
  > = new Set(
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(new BaseBlockModel(this, {})) as any
  );

  constructor(
    id: string,
    doc: Y.Doc,
    awareness: Awareness,
    idGenerator: IdGenerator = uuidv4,
    observeEvents = true
  ) {
    this.id = id;
    this.doc = doc;
    this._idGenerator = idGenerator;

    const aware = awareness ?? new Awareness(this.doc);
    this.awareness = new AwarenessAdapter(this, aware);

    // Consider if we need to expose the ability to temporarily unobserve this._yBlocks.
    // "unobserve" is potentially necessary to make sure we don't create
    // an infinite loop when sync to remote then back to client.
    // `action(a) -> YDoc' -> YEvents(a) -> YRemoteDoc' -> YEvents(a) -> YDoc'' -> ...`
    // We could unobserve in order to short circuit by ignoring the sync of remote
    // events we actually generated locally.
    // this._yBlocks.unobserveDeep(this._handleYEvents);
    if (observeEvents) {
      this._yBlocks.observeDeep(this._handleYEvents);
    }

    this._history = new Y.UndoManager([this._yBlocks], {
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
    });

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyAddObserver);
    this._history.on('stack-item-popped', this._historyPopObserver);
    this._history.on('stack-item-updated', this._historyObserver);
  }

  /** key-value store of blocks */
  protected get _yBlocks() {
    return this.doc.getMap(this.id) as YBlocks;
  }

  get root() {
    return this._root;
  }

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get canUndo() {
    return this._history.canUndo();
  }

  get canRedo() {
    return this._history.canRedo();
  }

  get Text() {
    return Text;
  }

  undo() {
    this._history.undo();
  }

  redo() {
    this._history.redo();
  }

  /** Capture current operations to undo stack synchronously. */
  captureSync() {
    this._history.stopCapturing();
  }

  resetHistory() {
    this._history.clear();
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }

  register(blockSchema: IBlockSchema) {
    Object.keys(blockSchema).forEach(key => {
      this._flavourMap.set(key, blockSchema[key as keyof IBlockSchema]);
    });
    return this;
  }

  getBlockById(id: string) {
    return this._blockMap.get(id) ?? null;
  }

  getBlockByFlavour(
    blockFlavour: InstanceType<IBlockSchema[keyof IBlockSchema]>['flavour']
  ) {
    return [...this._blockMap.values()].filter(
      ({ flavour }) => blockFlavour === flavour
    );
  }

  getParentById(rootId: string, target: BaseBlockModel): BaseBlockModel | null {
    if (rootId === target.id) return null;

    const root = this._blockMap.get(rootId);
    if (!root) return null;

    for (const [childId] of root.childMap) {
      if (childId === target.id) return root;

      const parent = this.getParentById(childId, target);
      if (parent !== null) return parent;
    }
    return null;
  }

  getParent(block: BaseBlockModel) {
    if (!this._root) return null;

    return this.getParentById(this._root.id, block);
  }

  getPreviousSibling(block: BaseBlockModel) {
    const parent = this.getParent(block);
    const index = parent?.children.indexOf(block) ?? -1;
    return parent?.children[index - 1] ?? null;
  }

  getNextSibling(block: BaseBlockModel) {
    const parent = this.getParent(block);
    const index = parent?.children.indexOf(block) ?? -1;
    if (index === -1) {
      return null;
    }
    return parent?.children[index + 1] ?? null;
  }

  addBlock<
    T extends Omit<BlockProps, 'flavour'> &
      Pick<InstanceType<IBlockSchema[keyof IBlockSchema]>, 'flavour'>
  >(
    blockProps: Partial<T>,
    parent?: BaseBlockModel | string,
    parentIndex?: number
  ): string {
    if (!blockProps.flavour) {
      throw new Error('Block props must contain flavour');
    }

    const clonedProps: Partial<BlockProps> = { ...blockProps };
    const id = this._idGenerator();
    clonedProps.id = id;

    this.transact(() => {
      const yBlock = new Y.Map() as YBlock;

      assertValidChildren(this._yBlocks, clonedProps);
      initSysProps(yBlock, clonedProps);
      syncBlockProps(yBlock, clonedProps, this._ignoredKeys);
      trySyncTextProp(this._splitSet, yBlock, clonedProps.text);

      if (typeof parent === 'string') {
        parent = this._blockMap.get(parent);
      }

      const parentId = parent?.id ?? this._root?.id;

      if (parentId) {
        const yParent = this._yBlocks.get(parentId) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;
        const index = parentIndex ?? yChildren.length;
        yChildren.insert(index, [id]);
      }

      this._yBlocks.set(id, yBlock);
    });
    return id;
  }

  updateBlockById(id: string, props: Partial<BlockProps>) {
    const model = this._blockMap.get(id) as BaseBlockModel;
    this.updateBlock(model, props);
  }

  updateBlock<T extends Partial<BlockProps>>(model: BaseBlockModel, props: T) {
    const yBlock = this._yBlocks.get(model.id) as YBlock;

    this.transact(() => {
      if (props.text instanceof PrelimText) {
        props.text.ready = true;
      } else if (props.text instanceof Text) {
        model.text = props.text;
        // @ts-ignore
        yBlock.set('prop:text', props.text._yText);
      }

      syncBlockProps(yBlock, props, this._ignoredKeys);
    });
  }

  deleteBlockById(id: string) {
    const model = this._blockMap.get(id) as BaseBlockModel;
    this.deleteBlock(model);
  }

  deleteBlock(model: BaseBlockModel) {
    const parent = this.getParent(model);
    const index = parent?.children.indexOf(model) ?? -1;
    if (index > -1) {
      parent?.children.splice(parent.children.indexOf(model), 1);
    }
    this._blockMap.delete(model.id);

    this.transact(() => {
      this._yBlocks.delete(model.id);
      model.dispose();

      if (parent) {
        const yParent = this._yBlocks.get(parent.id) as YBlock;
        const yChildren = yParent.get('sys:children') as Y.Array<string>;

        if (index > -1) {
          yChildren.delete(index, 1);
        }
      }
    });
  }

  /** Connect a rich text editor instance with a YText instance. */
  attachRichText(id: string, quill: Quill) {
    const yBlock = this._getYBlock(id);

    const yText = yBlock.get('prop:text') as Y.Text | null;
    if (!yText) {
      throw new Error(`Block "${id}" does not have text`);
    }

    const adapter = new RichTextAdapter(this, yText, quill);
    this.richTextAdapters.set(id, adapter);

    quill.on('selection-change', () => {
      const cursor = adapter.getCursor();
      if (!cursor) return;

      this.awareness.setLocalCursor({ ...cursor, id });
    });
  }

  /** Cancel the connection between the rich text editor instance and YText. */
  detachRichText(id: string) {
    const adapter = this.richTextAdapters.get(id);
    adapter?.destroy();
    this.richTextAdapters.delete(id);
  }

  markTextSplit(base: Text, left: PrelimText, right: PrelimText) {
    this._splitSet.add(base).add(left).add(right);
  }

  dispose() {
    this.signals.historyUpdated.dispose();
    this.signals.rootAdded.dispose();
    this.signals.rootDeleted.dispose();
    this.signals.textUpdated.dispose();
    this.signals.updated.dispose();

    this._yBlocks.forEach((_, key) => {
      this.deleteBlockById(key);
    });
  }

  private _getYBlock(id: string): YBlock {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      throw new Error(`Block with id ${id} does not exist`);
    }
    return yBlock;
  }

  private _historyAddObserver = (event: { stackItem: StackItem }) => {
    if (IS_WEB) {
      event.stackItem.meta.set(
        'cursor-location',
        this.awareness.getLocalCursor()
      );
    }

    this._historyObserver();
  };

  private _historyPopObserver = (event: { stackItem: StackItem }) => {
    const cursor = event.stackItem.meta.get('cursor-location');
    if (!cursor) {
      return;
    }

    this.awareness.setLocalCursor(cursor);
    this._historyObserver();
  };

  private _historyObserver = () => {
    this.signals.historyUpdated.emit();
  };

  private _createBlockModel(props: Omit<BlockProps, 'children'>) {
    const BlockModelCtor = this._flavourMap.get(props.flavour);
    if (!BlockModelCtor) {
      throw new Error(`Block flavour ${props.flavour} is not registered`);
    }

    // @ts-ignore
    const blockModel = new BlockModelCtor(this, props) as InstanceType<
      IBlockSchema[keyof IBlockSchema]
    >;
    return blockModel;
  }

  private _handleYBlockAdd(visited: Set<string>, id: string) {
    const yBlock = this._getYBlock(id);
    const isRoot = this._blockMap.size === 0;

    const prefixedProps = yBlock.toJSON() as PrefixedBlockProps;
    const props = toBlockProps(prefixedProps) as BlockProps;
    const model = this._createBlockModel({ ...props, id });
    this._blockMap.set(props.id, model);

    if (
      // TODO use schema
      matchFlavours(model, ['affine:paragraph', 'affine:list']) &&
      !yBlock.get('prop:text')
    ) {
      this.transact(() => yBlock.set('prop:text', new Y.Text()));
    }

    const yText = yBlock.get('prop:text') as Y.Text;
    const text = new Text(this, yText);
    model.text = text;

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
      this.signals.rootAdded.emit(model);
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
      this.signals.rootDeleted.emit(id);
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
    for (const key of event.keysChanged) {
      // TODO use schema
      if (key === 'prop:text') continue;
      props[key.replace('prop:', '')] = event.target.get(key);
    }
    Object.assign(model, props);
    model.propsUpdated.emit();
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
        this.signals.textUpdated.emit(event);
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
  }

  // Handle all the events that happen at _any_ level (potentially deep inside the structure).
  // So, we apply a listener at the top level for the flat structure of the current
  // page/space container.
  private _handleYEvents = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      this._handleYEvent(event);
    }
    this.signals.updated.emit();
  };
}
