import { services } from '@blocksuite/block-std';

import type { FontService } from './interface.js';

import { TYPES } from '../types.js';
import { FontServiceImpl } from './impl.js';

services.bind<FontService>(TYPES.Font).to(FontServiceImpl).inSingletonScope();
