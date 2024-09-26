import { createIdentifier } from '@blocksuite/global/di';

import type { Command } from './command/index.js';
import type { EventOptions, UIEventHandler } from './event/index.js';
import type { BlockService, LifeCycleWatcher } from './extension/index.js';
import type { BlockStdScope } from './scope/index.js';
import type { SelectionConstructor } from './selection/index.js';
import type { BlockViewType, WidgetViewMapType } from './spec/type.js';

export const BlockServiceIdentifier =
  createIdentifier<BlockService>('BlockService');

export const BlockFlavourIdentifier = createIdentifier<{ flavour: string }>(
  'BlockFlavour'
);

export const CommandIdentifier = createIdentifier<Command>('Commands');

export const ConfigIdentifier =
  createIdentifier<Record<string, unknown>>('Config');

export const BlockViewIdentifier = createIdentifier<BlockViewType>('BlockView');

export const WidgetViewMapIdentifier =
  createIdentifier<WidgetViewMapType>('WidgetViewMap');

export const LifeCycleWatcherIdentifier =
  createIdentifier<LifeCycleWatcher>('LifeCycleWatcher');

export const StdIdentifier = createIdentifier<BlockStdScope>('Std');

export const KeymapIdentifier = createIdentifier<{
  getter: (std: BlockStdScope) => Record<string, UIEventHandler>;
  options?: EventOptions;
}>('Keymap');

export const SelectionIdentifier =
  createIdentifier<SelectionConstructor>('Selection');
