import * as Y from 'yjs';
import { WebrtcProvider as DebugProvider } from 'y-webrtc';
import { Slot } from './utils/slot';
import { isPrimitive } from './utils/common';
import { TextBinding } from './text-binding';
import Quill from 'quill';
import { AwarenessMessage, YAwareness } from './awareness';

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
  private _history: Y.UndoManager;
  readonly awareness: YAwareness;

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

    this._history = new Y.UndoManager([this._yBlocks, this._yParentMap], {
      trackedOrigins: new Set([this.doc.clientID]),
      doc: this.doc,
    });

    this.awareness = new YAwareness(this);

    this._history.on('stack-cleared', this._historyObserver);
    this._history.on('stack-item-added', this._historyAddObserver);
    this._history.on('stack-item-popped', this._historyPopObserver);
    this._history.on('stack-item-updated', this._historyObserver);

    // todo selectmanage中实现
    this.awareness.slots.update.on((awMsg: AwarenessMessage) => {
      if (awMsg.type !== 'remove' && awMsg.state) {
        const anchor = Y.createAbsolutePositionFromRelativePosition(awMsg.state?.cursor.anchor, this.doc);
        const focus = Y.createAbsolutePositionFromRelativePosition(awMsg.state?.cursor.focus, this.doc);
        if (anchor && focus) {
          const textbind = this.textBindings.get(awMsg.state?.cursor.id || '');
          textbind?.quill.setSelection(anchor.index, focus.index - anchor.index);
        }
      }
    });
  }

  private _historyAddObserver = (event: any) => {
    event.stackItem.meta.set('cursor-location', this.awareness.getLocalCursor());
    this._historyObserver();
  };

  private _historyPopObserver = (event: any) => {
    this.awareness.setLocalCursor(event.stackItem.meta.get('cursor-location'));
    this._historyObserver();
  };

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

  get isEmpty() {
    return this._yBlocks.size === 0;
  }

  get canUndo() {
    return this._history.canUndo();
  }

  get canRedo() {
    return this._history.canRedo();
  }

  undo() {
    this._history.undo();
  }

  redo() {
    this._history.redo();
  }

  /** capture current operations to undo stack synchronously */
  captureSync() {
    this._history.stopCapturing();
  }

  restHistory() {
    this._history.clear();
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
    const binding = new TextBinding(this, yText, quill);
    this.textBindings.set(id, binding);

    // todo selectmanage中实现
    quill.on('selection-change', () => {
      const cursor = binding.getCursor()
      cursor && this.awareness.setLocalCursor({...cursor, id: id});
    });
  }
}
