import { createIdentifier } from '@labre/global/di';

import type { Store } from './store';

export const StoreIdentifier = createIdentifier<Store>('Store');
