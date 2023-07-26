import type { Page, Workspace } from '@blocksuite/store';

import { UIEventDispatcher } from '../event/index.js';
import { SelectionManager } from '../selection/index.js';
import { SpecStore } from './spec-store.js';
import { ViewStore } from './view-store.js';

export interface BlockStoreConfig<BlockViewType = unknown> {
  getBlockViewByNode: (node: Node) => BlockViewType | null;
}

export interface BlockStoreOptions<BlockViewType = unknown> {
  root: HTMLElement;
  workspace: Workspace;
  page: Page;
  config: BlockStoreConfig<BlockViewType>;
}

export class BlockStore<
  ComponentType = unknown,
  BlockViewType = unknown,
  WidgetViewType = unknown
> {
  page: Page;
  readonly workspace: Workspace;
  readonly uiEventDispatcher: UIEventDispatcher;
  readonly selectionManager: SelectionManager;
  readonly root: HTMLElement;
  readonly specStore: SpecStore<ComponentType>;
  readonly viewStore: ViewStore<BlockViewType, WidgetViewType>;
  readonly config: BlockStoreConfig<BlockViewType>;

  constructor(options: BlockStoreOptions<BlockViewType>) {
    this.root = options.root;
    this.workspace = options.workspace;
    this.page = options.page;
    this.config = options.config;
    this.uiEventDispatcher = new UIEventDispatcher(this);
    this.selectionManager = new SelectionManager(this);
    this.specStore = new SpecStore<ComponentType>(this);
    this.viewStore = new ViewStore<BlockViewType, WidgetViewType>();
  }

  mount() {
    this.selectionManager.mount();
    this.uiEventDispatcher.mount();
  }

  unmount() {
    this.uiEventDispatcher.unmount();
    this.selectionManager.unmount();
    this.viewStore.clear();
    this.specStore.dispose();
  }
}
