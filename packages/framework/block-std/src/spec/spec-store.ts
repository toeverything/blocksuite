import { Slot } from '@blocksuite/global/utils';

import type { BlockService } from '../extension/index.js';
import type { BlockSpec } from './index.js';

import {
  BlockServiceIdentifier,
  BlockServiceWatcherIdentifier,
} from '../scope/identifier.js';

export class SpecStore {
  private _runSetup = (newSpecs: Map<string, BlockSpec>) => {
    newSpecs.forEach(newSpec => {
      const container = this.std.container;
      newSpec.extensions?.forEach(ext => {
        if ('setup' in ext) {
          ext.setup(container);
          return;
        }
        ext(container);
      });
    });
  };

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
    this._runSetup(newSpecs);
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
    return this.std.provider.get(BlockServiceIdentifier(flavour));
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

    this.std.provider.getAll(BlockServiceWatcherIdentifier).forEach(watcher => {
      watcher.listen();
    });

    this.std.provider.getAll(BlockServiceIdentifier).forEach(service => {
      service.mounted();
    });

    this.slots.afterMount.emit();
  }

  unmount() {
    this.slots.beforeUnmount.emit();

    this.std.provider.getAll(BlockServiceIdentifier).forEach(service => {
      service.dispose();
      service.unmounted();
    });

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
