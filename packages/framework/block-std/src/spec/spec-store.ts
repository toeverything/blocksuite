import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import type { BlockSpec } from './index.js';

import { BlockService } from '../service/index.js';
import { getSlots } from './slots.js';

export class SpecStore {
  private _disposables = new DisposableGroup();

  private _services = new Map<string, BlockService>();

  private _specs = new Map<string, BlockSpec>();

  readonly slots = {
    beforeApply: new Slot(),
    beforeMount: new Slot(),
    beforeUnmount: new Slot(),
    afterApply: new Slot(),
    afterMount: new Slot(),
    afterUnmount: new Slot(),
  };

  constructor(public std: BlockSuite.Std) {}

  private _buildSpecMap(specs: Array<BlockSpec>) {
    const specMap = new Map<string, BlockSpec>();
    specs.forEach(spec => {
      specMap.set(spec.schema.model.flavour, spec);
    });
    return specMap;
  }

  private _diffServices(
    oldSpecs: Map<string, BlockSpec>,
    newSpecs: Map<string, BlockSpec>
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

      const Service = newSpec.service ?? BlockService;

      const slots = getSlots();
      const service = new Service({
        flavour,
        std: this.std,
        slots,
      });

      newSpec.setup?.(slots, this._disposables);
      this._services.set(flavour, service);
      service.mounted();
    });
  }

  applySpecs(specs: BlockSpec[]) {
    this.slots.beforeApply.emit();

    const oldSpecs = this._specs;
    const newSpecs = this._buildSpecMap(specs);
    this._diffServices(oldSpecs, newSpecs);
    this._specs = newSpecs;

    this.slots.afterApply.emit();
  }

  getConfig<Key extends BlockSuite.ConfigKeys>(
    flavour: string
  ): BlockSuite.BlockConfigs[Key] | null;

  getConfig(flavour: string) {
    const spec = this._specs.get(flavour);
    if (!spec) {
      return null;
    }

    return spec.config;
  }

  getService<Key extends BlockSuite.ServiceKeys>(
    flavour: Key
  ): BlockSuite.BlockServices[Key];

  getService<Service extends BlockService>(flavour: string): Service;

  getService(flavour: string): BlockService {
    return this._services.get(flavour) as never;
  }

  getView(flavour: string) {
    const spec = this._specs.get(flavour);
    if (!spec) {
      return null;
    }

    return spec.view;
  }

  mount() {
    this.slots.beforeMount.emit();

    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }

    this.slots.afterMount.emit();
  }

  unmount() {
    this.slots.beforeUnmount.emit();

    this._services.forEach(service => {
      service.dispose();
      service.unmounted();
    });
    this._services.clear();
    this._disposables.dispose();

    this.slots.afterUnmount.emit();
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {}
    interface BlockConfigs {}

    type ServiceKeys = string & keyof BlockServices;
    type ConfigKeys = string & keyof BlockConfigs;
  }
}
