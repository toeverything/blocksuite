import { signal, type Signal } from '@preact/signals-core';

import { createContextKey } from '../../core/index.js';

export const ShowFilterContextKey = createContextKey<
  Signal<Record<string, boolean>>
>('show-filter', signal({}));
