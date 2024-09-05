import type { ServiceProvider } from '@blocksuite/global/di';
import type { Doc } from '@blocksuite/store';

import { Container } from '@blocksuite/global/di';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

import type { BlockService } from '../extension/index.js';
import type { ExtensionType } from '../extension/index.js';

import { Clipboard } from '../clipboard/index.js';
import { CommandManager } from '../command/index.js';
import { UIEventDispatcher } from '../event/index.js';
import { GfxController } from '../gfx/controller.js';
import {
  BlockServiceIdentifier,
  BlockViewIdentifier,
  ConfigIdentifier,
  LifeCycleWatcherIdentifier,
  StdIdentifier,
} from '../identifier.js';
import { RangeManager } from '../range/index.js';
import { SelectionManager } from '../selection/index.js';
import { ServiceManager } from '../service/index.js';
import { EditorHost } from '../view/element/index.js';
import { ViewStore } from '../view/view-store.js';

export interface BlockStdOptions {
  doc: Doc;
  extensions: ExtensionType[];
}

const internalExtensions = [
  ServiceManager,
  CommandManager,
  UIEventDispatcher,
  SelectionManager,
  RangeManager,
  ViewStore,
  Clipboard,
  GfxController,
];

export class BlockStdScope {
  private _getHost: () => EditorHost;

  readonly container: Container;

  readonly doc: Doc;

  readonly extensions: ExtensionType[];

  readonly provider: ServiceProvider;

  constructor(options: BlockStdOptions) {
    this._getHost = () => {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        'Host is not ready to use, the `render` method should be called first'
      );
    };
    this.doc = options.doc;
    this.extensions = [...internalExtensions, ...options.extensions];
    this.container = new Container();
    this.container.addImpl(StdIdentifier, () => this);

    this.extensions.forEach(ext => {
      const container = this.container;
      ext.setup(container);
    });

    this.provider = this.container.provider();

    this._lifeCycleWatchers.forEach(watcher => {
      watcher.created.call(watcher);
    });
  }

  private get _lifeCycleWatchers() {
    return this.provider.getAll(LifeCycleWatcherIdentifier);
  }

  getConfig<Key extends BlockSuite.ConfigKeys>(
    flavour: Key
  ): BlockSuite.BlockConfigs[Key] | null;

  getConfig(flavour: string) {
    const config = this.provider.getOptional(ConfigIdentifier(flavour));
    if (!config) {
      return null;
    }

    return config;
  }

  getService<Key extends BlockSuite.ServiceKeys>(
    flavour: Key
  ): BlockSuite.BlockServices[Key];

  getService<Service extends BlockService>(flavour: string): Service;

  getService(flavour: string): BlockService {
    return this.get(BlockServiceIdentifier(flavour));
  }

  getView(flavour: string) {
    return this.getOptional(BlockViewIdentifier(flavour));
  }

  mount() {
    this._lifeCycleWatchers.forEach(watcher => {
      watcher.mounted.call(watcher);
    });
  }

  render() {
    const element = new EditorHost();
    element.std = this;
    element.doc = this.doc;
    this._getHost = () => element;
    this._lifeCycleWatchers.forEach(watcher => {
      watcher.rendered.call(watcher);
    });

    return element;
  }

  unmount() {
    this._lifeCycleWatchers.forEach(watcher => {
      watcher.unmounted.call(watcher);
    });
  }

  get clipboard() {
    return this.get(Clipboard);
  }

  get collection() {
    return this.doc.collection;
  }

  get command() {
    return this.get(CommandManager);
  }

  get event() {
    return this.get(UIEventDispatcher);
  }

  get get() {
    return this.provider.get.bind(this.provider);
  }

  get getOptional() {
    return this.provider.getOptional.bind(this.provider);
  }

  get host() {
    return this._getHost();
  }

  get range() {
    return this.get(RangeManager);
  }

  get selection() {
    return this.get(SelectionManager);
  }

  get view() {
    return this.get(ViewStore);
  }
}

declare global {
  namespace BlockSuite {
    interface BlockServices {}
    interface BlockConfigs {}

    type ServiceKeys = string & keyof BlockServices;
    type ConfigKeys = string & keyof BlockConfigs;

    type Std = BlockStdScope;
  }
}
