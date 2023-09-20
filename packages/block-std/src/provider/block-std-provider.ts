import type { Page, Workspace } from '@blocksuite/store';

import { Clipboard } from '../clipboard/index.js';
import { CommandManager } from '../command/index.js';
import { UIEventDispatcher } from '../event/index.js';
import { SelectionManager } from '../selection/index.js';
import { SpecStore } from '../spec/index.js';
import { ViewStore } from '../view/index.js';

export interface BlockStdProviderOptions {
  root: HTMLElement;
  workspace: Workspace;
  page: Page;
}

export class BlockStdProvider {
  readonly page: Page;
  readonly workspace: Workspace;
  readonly event: UIEventDispatcher;
  readonly selection: SelectionManager;
  readonly command: CommandManager;
  readonly root: HTMLElement;
  readonly spec: SpecStore<Values<BlockSuite.ComponentType>>;
  readonly view: ViewStore<Values<BlockSuite.NodeView>>;
  readonly clipboard: Clipboard;

  constructor(options: BlockStdProviderOptions) {
    this.root = options.root;
    this.workspace = options.workspace;
    this.page = options.page;
    this.event = new UIEventDispatcher(this);
    this.selection = new SelectionManager(this);
    this.command = new CommandManager(this);
    this.spec = new SpecStore<Values<BlockSuite.ComponentType>>(this);
    this.view = new ViewStore<Values<BlockSuite.NodeView>>(this);
    this.clipboard = new Clipboard(this);
  }

  mount() {
    this.selection.mount();
    this.event.mount();
    this.view.mount();
  }

  unmount() {
    this.event.unmount();
    this.selection.unmount();
    this.view.unmount();
    this.spec.dispose();
  }
}

type Values<T> = T[keyof T] extends never ? unknown : T[keyof T];

declare global {
  namespace BlockSuite {
    interface ComponentType {}
    interface NodeView {}

    type Std = BlockStdProvider;
  }
}
