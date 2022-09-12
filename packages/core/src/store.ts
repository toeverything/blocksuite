import * as Y from 'yjs';
import { WebrtcProvider as DebugProvider } from 'y-webrtc';
import { Slot } from './utils/slot';
import { isPrimitive } from './utils/common';
import { TextBinding } from './text-binding';
import Quill from 'quill';

type YBlock = Y.Map<unknown>;
type YBlocks = Y.Map<YBlock>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockProps = Record<string, any> & {
  id: string;
  parentId: string;
  type: string;
};

let i = 1; // for debug use, 0 for root
let created = false;

export interface SerializedStore {
  blocks: {
    [key: string]: BlockProps;
  };
  parentMap: {
    [key: string]: string;
  };
}

export class Store {
  readonly doc = new Y.Doc();
  readonly provider: DebugProvider;
  readonly history: Y.UndoManager;

  readonly slots = {
    update: new Slot(),
    historyUpdate: new Slot(),
    addBlock: new Slot<BlockProps>(),
    deleteBlock: new Slot<string>(),
    updateText: new Slot<Y.YTextEvent>(),
  };

  readonly textBindings = new Map<string, TextBinding>();

  constructor(room: string) {
    if (created) {
      throw new Error('Store should only be created once');
    }
    created = true;

    this.provider = new DebugProvider(room, this.doc);
    this._yBlocks.observeDeep(this._yBlocksObserver);
    this._yParentMap.observeDeep(this._yParentMapObserver);

    this.history = new Y.UndoManager([this._yBlocks, this._yParentMap], {
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
    });

    this.history.on('stack-cleared', this._historyObserver);
    this.history.on('stack-item-added', this._historyObserver);
    this.history.on('stack-item-popped', this._historyObserver);
    this.history.on('stack-item-updated', this._historyObserver);
  }

  private _historyObserver = () => {
    this.slots.historyUpdate.emit();
  };

  private _yBlocksObserver = (events: Y.YEvent<YBlock | Y.Text>[]) => {
    for (const event of events) {
      if (event instanceof Y.YTextEvent) {
        this.slots.updateText.emit(event);
      }
    }
    this.slots.update.emit();
  };

  private _yParentMapObserver = (events: Y.YEvent<Y.Map<string>>[]) => {
    for (const event of events) {
      event.keys.forEach((value, id) => {
        if (value.action === 'add') {
          const yBlock = this._getYBlock(id);
          const props = yBlock.toJSON() as BlockProps;
          this.slots.addBlock.emit(props);
        } else if (value.action === 'update') {
          // TODO
        } else if (value.action === 'delete') {
          this.slots.deleteBlock.emit(id);
        }
      });
    }

    this.slots.update.emit();
  };

  /** key-value store of blocks */
  private get _yBlocks() {
    return this.doc.getMap('blocks') as YBlocks;
  }

  /** mapping for finding parent of certain block */
  private get _yParentMap() {
    return this.doc.getMap('parentMap') as Y.Map<string>;
  }

  private _getYBlock(id: string): YBlock {
    const yBlock = this._yBlocks.get(id) as YBlock | undefined;
    if (!yBlock) {
      throw new Error(`Block with id ${id} does not exist`);
    }
    return yBlock;
  }

  transact(fn: () => void) {
    this.doc.transact(fn, this.doc.clientID);
  }

  createId(): string {
    return (i++).toString();
  }

  addBlock(blockProps: BlockProps) {
    if (this._yBlocks.has(blockProps.id)) {
      throw new Error(`Block with id ${blockProps.id} already exists`);
    }
    if (!blockProps.id || !blockProps.parentId || !blockProps.type) {
      throw new Error('Block props must contain id, parentId, and type');
    }

    const yBlock = new Y.Map() as YBlock;
    Object.keys(blockProps).forEach(key => {
      if (!isPrimitive(blockProps[key])) {
        throw new Error('Only top level primitives are supported for now');
      }

      if (blockProps[key] !== undefined) {
        yBlock.set(key, blockProps[key]);
      }
    });

    this.transact(() => {
      this._yBlocks.set(blockProps.id, yBlock);
      this._yParentMap.set(blockProps.id, blockProps.parentId);
    });
  }

  attachText(id: string, text: string, quill: Quill) {
    const yBlock = this._getYBlock(id);
    const yText = new Y.Text(text);
    this.doc.transact(() => {
      yBlock.set('text', yText);
    }, null);
    // const yText = this.doc.getText(id);
    this.history.addToScope(yText);
    const binding = new TextBinding(this, yText, quill);
    this.textBindings.set(id, binding);
  }
}
