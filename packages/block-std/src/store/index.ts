import type { UIEventDispatcher } from '../event/index.js';
import type { SelectionManager } from '../selection/index.js';
import type { BlockService, BlockServiceOptions } from '../service/index.js';
import type { BlockSpec } from '../spec/index.js';

export interface BlockStoreOptions {
  uiEventDispatcher: UIEventDispatcher;
  selectionManager: SelectionManager;
}

export class BlockStore<ComponentType = unknown> {
  private _specs: Map<string, BlockSpec<ComponentType>> = new Map();
  private _services: Map<string, BlockService> = new Map();
  private readonly _uiEventDispatcher: UIEventDispatcher;
  private readonly _selectionManager: SelectionManager;
  constructor(options: BlockStoreOptions) {
    this._uiEventDispatcher = options.uiEventDispatcher;
    this._selectionManager = options.selectionManager;
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
      uiEventDispatcher: this._uiEventDispatcher,
      selectionManager: this._selectionManager,
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
