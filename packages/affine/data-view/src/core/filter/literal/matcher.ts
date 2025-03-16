import type { ReadonlySignal } from '@preact/signals-core';

import { typeSystem } from '../../logical/index.js';
import type { TypeInstance } from '../../logical/type.js';
import { allLiteralConfig } from './define.js';

export const literalItemsMatcher = {
  getItems: (
    type: TypeInstance,
    value: ReadonlySignal<unknown>,
    onChange: (value: unknown) => void
  ) => {
    for (const config of allLiteralConfig) {
      if (typeSystem.unify(type, config.type)) {
        return config.getItems(type, value, onChange);
      }
    }
    return [];
  },
};
