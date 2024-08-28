import type { Doc, DocCollection } from '@blocksuite/store';

import { Container } from '@blocksuite/global/di';

import type { EditorHost } from '../view/element/index.js';

import { Clipboard } from '../clipboard/index.js';
import { CommandManager } from '../command/index.js';
import { UIEventDispatcher } from '../event/index.js';
import { RangeManager } from '../range/index.js';
import { SelectionManager } from '../selection/index.js';
import { SpecStore } from '../spec/index.js';
import { ViewStore } from '../view/view-store.js';

export interface BlockStdOptions {
  host: EditorHost;
  doc: Doc;
}

export class BlockStdScope {
  readonly clipboard: Clipboard;

  readonly collection: DocCollection;

  readonly command: CommandManager;

  readonly container: Container;

  readonly doc: Doc;

  readonly event: UIEventDispatcher;

  readonly host: EditorHost;

  readonly range: RangeManager;

  readonly selection: SelectionManager;

  readonly spec: SpecStore;

  readonly view: ViewStore;

  constructor(options: BlockStdOptions) {
    this.host = options.host;
    this.collection = options.doc.collection;
    this.doc = options.doc;
    this.event = new UIEventDispatcher(this);
    this.selection = new SelectionManager(this);
    this.range = new RangeManager(this.host);
    this.command = new CommandManager(this);
    this.spec = new SpecStore(this);
    this.view = new ViewStore(this);
    this.clipboard = new Clipboard(this);
    this.container = new Container();
    this.container.addFactory(BlockStdScope, () => this);
  }

  mount() {
    this.selection.mount();
    this.range.mount();
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

declare global {
  namespace BlockSuite {
    type Std = BlockStdScope;
  }
}
