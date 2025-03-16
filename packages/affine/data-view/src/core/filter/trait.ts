import { computed, type ReadonlySignal } from '@preact/signals-core';

import { createTraitKey } from '../traits/key.js';
import type { SingleView } from '../view-manager/index.js';
import type { FilterGroup } from './types.js';

export class FilterTrait {
  filterSet = (filter: FilterGroup) => {
    this.config.filterSet(filter);
  };

  hasFilter$ = computed(() => {
    return this.filter$.value.conditions.length > 0;
  });

  constructor(
    readonly filter$: ReadonlySignal<FilterGroup>,
    readonly view: SingleView,
    readonly config: {
      filterSet: (filter: FilterGroup) => void;
    }
  ) {}
}

export const filterTraitKey = createTraitKey<FilterTrait>('filter');
