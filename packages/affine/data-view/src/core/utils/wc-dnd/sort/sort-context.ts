import { computed, effect, type ReadonlySignal } from '@preact/signals-core';

import {
  DndContext,
  type DndContextConfig,
  draggableDataName,
  droppableDataName,
} from '../dnd-context.js';
import type { Disabled, SortingStrategy, UniqueIdentifier } from '../types.js';
import { createDataDirective } from '../utils/data-directive.js';
import { asHTMLElement } from '../utils/element.js';

export type CommonSortContextConfig = {};
export type SortContextConfig = {
  strategy: SortingStrategy;
  items: ReadonlySignal<UniqueIdentifier[]>;
  id?: string;
  disabled?: ReadonlySignal<boolean | Disabled>;
} & DndContextConfig;

export class SortContext extends DndContext {
  disabled = computed(() => {
    const disabled = this.config.disabled?.value ?? false;
    return typeof disabled === 'boolean'
      ? { draggable: disabled, droppable: disabled }
      : {
          draggable: disabled.draggable ?? false,
          droppable: disabled.droppable ?? false,
        };
  });

  dragSourceList$ = computed(() => {
    if (!this.active$.value) {
      return;
    }
    return this.items.value.flatMap(id => {
      const ele = asHTMLElement(
        this.container.querySelector(`[${draggableDataName.attribute}='${id}']`)
      );
      if (!ele) {
        return [];
      }
      return {
        node: ele,
        id,
        rect: ele.getBoundingClientRect(),
      };
    });
  });

  get items() {
    return this.config.items;
  }

  get strategy() {
    return this.config.strategy;
  }

  constructor(override config: SortContextConfig) {
    super(config);
    effect(() => {
      const list = this.dragSourceList$.value;
      if (list) {
        const transforms = this.strategy({
          rects: list.map(v => v.rect),
          activeNodeRect: this.collisionRect$.value,
          activeIndex: list.findIndex(v => v.id === this.active$.value?.id),
          overIndex: list.findIndex(v => v.id === this.overId$.value),
        });
        transforms.forEach((transform, i) => {
          const node = list[i]?.node;
          if (!node) {
            return;
          }
          if (transform != null) {
            node.style.transform = `translate3d(${Math.round(transform.x)}px,${Math.round(transform.y)}px,0)
    scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`;
          } else {
            node.style.transform = '';
          }
        });
      }
    });
  }
}

export const createSortContext = (config: SortContextConfig) => {
  return new SortContext(config);
};
const _sortable = createDataDirective(draggableDataName, droppableDataName);
export const sortable = (id: string) => {
  return _sortable(id, id);
};
