import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import { BlockService } from '../service/index.js';
import type { BlockSpec } from './index.js';
import { getSlots } from './slots.js';

export class SpecStore {
  private _specs: Map<string, BlockSpec> = new Map();
  private _services: Map<string, BlockService> = new Map();
  private _disposables = new DisposableGroup();

  constructor(public std: BlockSuite.Std) {}

  readonly slots = {
    beforeApply: new Slot(),
    beforeMount: new Slot(),
    beforeUnmount: new Slot(),
    afterApply: new Slot(),
    afterMount: new Slot(),
    afterUnmount: new Slot(),
  };

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

  applySpecs(specs: BlockSpec[]) {
    this.slots.beforeApply.emit();

    const oldSpecs = this._specs;
    const newSpecs = this._buildSpecMap(specs);
    this._diffServices(oldSpecs, newSpecs);
    this._specs = newSpecs;

    this.slots.afterApply.emit();
  }

  getView(flavour: string) {
    const spec = this._specs.get(flavour);
    if (!spec) {
      return null;
    }

    return spec.view;
  }

  getService<Key extends BlockSuite.ServiceKeys>(
    flavour: Key
  ): BlockSuite.BlockServices[Key];
  getService<Service extends BlockService>(flavour: string): Service;
  getService(flavour: string): BlockService {
    return this._services.get(flavour) as never;
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

  private _buildSpecMap(specs: Array<BlockSpec>) {
    const specMap = new Map<string, BlockSpec>();
    specs.forEach(spec => {
      specMap.set(spec.schema.model.flavour, spec);
    });
    return specMap;
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {}

    type ServiceKeys = string & keyof BlockServices;
  }
}
