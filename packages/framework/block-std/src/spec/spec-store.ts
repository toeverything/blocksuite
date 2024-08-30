import { DisposableGroup, Slot } from '@blocksuite/global/utils';

import type { BlockSpec } from './index.js';

import { BlockService } from '../service/index.js';
import { getSlots } from './slots.js';

export class SpecStore {
  private _createServices = (newSpecs: Map<string, BlockSpec>) => {
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

      const container = this.std.container;
      newSpec.setup?.(slots, this._disposables, container);
      this._services.set(flavour, service);
    });
  };

  private _disposables = new DisposableGroup();

  private _services = new Map<string, BlockService>();

  private _specs = new Map<string, BlockSpec>();

  readonly slots = {
    beforeMount: new Slot(),
    beforeUnmount: new Slot(),
    afterMount: new Slot(),
    afterUnmount: new Slot(),
  };

  constructor(
    public std: BlockSuite.Std,
    specs: BlockSpec[]
  ) {
    const newSpecs = this._buildSpecMap(specs);
    this._registerCommands(newSpecs);
    this._createServices(newSpecs);
    this._specs = newSpecs;
  }

  private _buildSpecMap(specs: Array<BlockSpec>) {
    const specMap = new Map<string, BlockSpec>();
    specs.forEach(spec => {
      specMap.set(spec.schema.model.flavour, spec);
    });
    return specMap;
  }

  private _registerCommands(specs: Map<string, BlockSpec>) {
    specs.forEach((spec, _flavour) => {
      const { commands } = spec;
      if (!commands) return;
      Object.entries(commands).forEach(([key, command]) => {
        this.std.command.add(key as keyof BlockSuite.Commands, command);
      });
    });
  }

  getConfig<Key extends BlockSuite.ConfigKeys>(
    flavour: Key
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

    this._services.forEach(service => {
      service.mounted();
    });

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
