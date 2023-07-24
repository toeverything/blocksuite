import type { Page, Workspace } from '@blocksuite/store';

import type { UIEventDispatcher } from '../event/index.js';
import type { SelectionManager } from '../selection/index.js';
import type { BlockService, BlockServiceOptions } from '../service/index.js';
import type { BlockSpec } from '../spec/index.js';

export interface BlockStoreOptions {
  root: HTMLElement;
  uiEventDispatcher: UIEventDispatcher;
  selectionManager: SelectionManager;
  workspace: Workspace;
  page: Page;
}

export class BlockStore<ComponentType = unknown> {
  page: Page;
  readonly workspace: Workspace;
  readonly uiEventDispatcher: UIEventDispatcher;
  readonly selectionManager: SelectionManager;
  readonly root: HTMLElement;

  private _specs: Map<string, BlockSpec<ComponentType>> = new Map();
  private _services: Map<string, BlockService> = new Map();
  constructor(options: BlockStoreOptions) {
    this.root = options.root;
    this.workspace = options.workspace;
    this.page = options.page;
    this.uiEventDispatcher = options.uiEventDispatcher;
    this.selectionManager = options.selectionManager;
  }

  applySpecs(specs: Array<BlockSpec<ComponentType>>) {
    const oldSpecs = this._specs;
    const newSpecs = this._buildSpecMap(specs);
    this._diffServices(oldSpecs, newSpecs);
    this._specs = newSpecs;
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

      const service = new newSpec.service(this._serviceOptions);
      this._services.set(flavour, service);
      service.mounted();
    });
  }

  private get _serviceOptions(): BlockServiceOptions {
    return {
      store: this,
    };
  }

  private _buildSpecMap(specs: Array<BlockSpec<ComponentType>>) {
    const specMap = new Map<string, BlockSpec<ComponentType>>();
    specs.forEach(spec => {
      specMap.set(spec.schema.model.flavour, spec);
    });
    return specMap;
  }
}
