import { type Signal, signal } from '@preact/signals-core';

import { createContextKey } from '../../core/index.js';

export const ShowQuickSettingBarContextKey = createContextKey<
  Signal<Record<string, boolean>>
>('show-quick-setting-bar', signal({}));
