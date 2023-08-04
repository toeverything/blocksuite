import type { BlockService } from '../service/index.js';
import type { BlockSpec } from '../spec/index.js';
import type { BlockStore } from './block-store.js';

export class SpecStore<ComponentType = unknown> {
  private _specs: Map<string, BlockSpec<ComponentType>> = new Map();
  private _services: Map<string, BlockService> = new Map();

  constructor(public blockStore: BlockStore) {}

  dispose() {
    this._services.forEach(service => {
      service.dispose();
      service.unmounted();
    });
    this._services.clear();
  }

  applySpecs(specs: Array<BlockSpec<ComponentType>>) {
    const oldSpecs = this._specs;
    const newSpecs = this._buildSpecMap(specs);
    this._diffServices(oldSpecs, newSpecs);
    this._specs = newSpecs;
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
        store: this.blockStore,
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
