import type { Page, Workspace } from '@blocksuite/store';

import { UIEventDispatcher } from '../event/index.js';
import { SelectionManager } from '../selection/index.js';
import type { BlockService } from '../service/index.js';
import type { BlockSpec } from '../spec/index.js';
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
  readonly viewStore: ViewStore<BlockViewType, WidgetViewType>;
  readonly config: BlockStoreConfig<BlockViewType>;

  private _specs: Map<string, BlockSpec<ComponentType>> = new Map();
  private _services: Map<string, BlockService> = new Map();
  constructor(options: BlockStoreOptions<BlockViewType>) {
    this.root = options.root;
    this.workspace = options.workspace;
    this.page = options.page;
    this.config = options.config;
    this.uiEventDispatcher = new UIEventDispatcher(this);
    this.selectionManager = new SelectionManager(this);
    this.viewStore = new ViewStore<BlockViewType, WidgetViewType>();
  }

  applySpecs(specs: Array<BlockSpec<ComponentType>>) {
    const oldSpecs = this._specs;
    const newSpecs = this._buildSpecMap(specs);
    this._diffServices(oldSpecs, newSpecs);
    this._specs = newSpecs;
  }

  mount() {
    this.selectionManager.mount();
    this.uiEventDispatcher.mount();
  }

  unmount() {
    this.uiEventDispatcher.unmount();
    this.selectionManager.unmount();
    this.viewStore.clear();
    this.dispose();
  }

  dispose() {
    this._services.forEach(service => {
      service.dispose();
      service.unmounted();
    });
    this._services.clear();
  }

  getView(flavour: string) {
    const spec = this._specs.get(flavour);
    if (!spec) {
      return null;
    }

    return spec.view;
  }

  getService(flavour: string) {
    return this._services.get(flavour);
  }

  private _diffServices(
    oldSpecs: Map<string, BlockSpec<ComponentType>>,
    newSpecs: Map<string, BlockSpec<ComponentType>>
  ) {
    oldSpecs.forEach((oldSpec, flavour) => {
      if (
        newSpecs.has(flavour) &&
        newSpecs.get(flavour)?.service === oldSpec.service
      ) {
        return;
      }

      const service = this._services.get(flavour);
      if (service) {
        service.dispose();
        service.unmounted();
      }
      this._services.delete(flavour);
    });
    newSpecs.forEach((newSpec, flavour) => {
      if (this._services.has(flavour)) {
        return;
      }

      if (!newSpec.service) {
        return;
      }

      const service = new newSpec.service({
        flavour,
        store: this,
      });
      this._services.set(flavour, service);
      service.mounted();
    });
  }

  private _buildSpecMap(specs: Array<BlockSpec<ComponentType>>) {
    const specMap = new Map<string, BlockSpec<ComponentType>>();
    specs.forEach(spec => {
      specMap.set(spec.schema.model.flavour, spec);
    });
    return specMap;
  }
}
