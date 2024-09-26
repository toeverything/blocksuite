import type { ServiceIdentifier } from '@blocksuite/global/di';

import type { GfxController } from './controller.js';

import { LifeCycleWatcherIdentifier } from '../identifier.js';

export const gfxControllerKey = 'GfxController';

export const GfxControllerIdentifier = LifeCycleWatcherIdentifier(
  gfxControllerKey
) as ServiceIdentifier<GfxController>;
