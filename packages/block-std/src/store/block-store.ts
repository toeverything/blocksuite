import type { Page, Workspace } from '@blocksuite/store';

import { CommandManager } from '../command/index.js';
import { UIEventDispatcher } from '../event/index.js';
import { SelectionManager } from '../selection/index.js';
import { SpecStore } from './spec-store.js';
import { ViewStore } from './view-store.js';

export interface BlockStoreOptions {
  root: HTMLElement;
  workspace: Workspace;
  page: Page;
}

export class BlockStore<ComponentType = unknown, NodeView = unknown> {
  page: Page;
  readonly workspace: Workspace;
  readonly uiEventDispatcher: UIEventDispatcher;
  readonly selectionManager: SelectionManager;
  readonly commandManager: CommandManager;
  readonly root: HTMLElement;
  readonly specStore: SpecStore<ComponentType>;
  readonly viewStore: ViewStore<NodeView>;

  constructor(options: BlockStoreOptions) {
    this.root = options.root;
    this.workspace = options.workspace;
    this.page = options.page;
    this.uiEventDispatcher = new UIEventDispatcher(this);
    this.selectionManager = new SelectionManager(this);
    this.commandManager = new CommandManager(this);
    this.specStore = new SpecStore<ComponentType>(this);
    this.viewStore = new ViewStore<NodeView>(this);
  }

  mount() {
    this.selectionManager.mount();
    this.uiEventDispatcher.mount();
    this.viewStore.mount();
  }

  unmount() {
    this.uiEventDispatcher.unmount();
    this.selectionManager.unmount();
    this.viewStore.unmount();
    this.specStore.dispose();
  }
}
