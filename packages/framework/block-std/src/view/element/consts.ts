import type { BlockModel } from '@blocksuite/store';

import { createContext } from '@lit/context';

import type { BlockService } from '../../service/index.js';

export const modelContext = createContext<BlockModel>('model');
export const serviceContext = createContext<BlockService>('service');
export const blockComponentSymbol = Symbol('blockComponent');
