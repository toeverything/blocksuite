import type { Doc, DocCollection } from '@blocksuite/store';

import { Clipboard } from '../clipboard/index.js';
import { CommandManager } from '../command/index.js';
import { UIEventDispatcher } from '../event/index.js';
import { SelectionManager } from '../selection/index.js';
import { SpecStore } from '../spec/index.js';
import { ViewStore } from '../view/index.js';

export interface BlockStdOptions {
  host: HTMLElement;
  doc: Doc;
}

export class BlockStdScope {
  readonly doc: Doc;
  readonly collection: DocCollection;
  readonly event: UIEventDispatcher;
  readonly selection: SelectionManager;
  readonly command: CommandManager;
  readonly host: HTMLElement;
  readonly spec: SpecStore;
  readonly view: ViewStore;
  readonly clipboard: Clipboard;

  constructor(options: BlockStdOptions) {
    this.host = options.host;
    this.collection = options.doc.collection;
    this.doc = options.doc;
    this.event = new UIEventDispatcher(this);
    this.selection = new SelectionManager(this);
    this.command = new CommandManager(this);
    this.spec = new SpecStore(this);
    this.view = new ViewStore(this);
    this.clipboard = new Clipboard(this);
  }

  mount() {
    this.selection.mount();
    this.event.mount();
    this.view.mount();
    this.spec.mount();
  }

  unmount() {
    this.event.unmount();
    this.selection.unmount();
    this.view.unmount();
    this.spec.unmount();
  }
}

type Values<T> = T[keyof T] extends never ? unknown : T[keyof T];

declare global {
  namespace BlockSuite {
    interface ComponentType {}
    interface NodeViewType {}

    type Component = Values<ComponentType>;

    type Std = BlockStdScope;
  }
}
