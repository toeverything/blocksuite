import { computed, effect, type ReadonlySignal } from '@preact/signals-core';

import type { Disabled, SortingStrategy, UniqueIdentifier } from '../types.js';

import {
  createDndContext,
  DndContext,
  type DndContextConfig,
  draggableDataName,
  droppableDataName,
} from '../dnd-context.js';
import { closestCenter } from '../utils/closest-center.js';
import { createDataDirective } from '../utils/data-directive.js';
import { asHTMLElement } from '../utils/element.js';
import { horizontalListSortingStrategy } from './strategies/index.js';

export type CommonSortContextConfig = {
  items: ReadonlySignal<UniqueIdentifier[]>;
  id?: string;
  disabled?: ReadonlySignal<boolean | Disabled>;
};
export type SortContextConfig = {
  dndContext: DndContext;
  strategy: SortingStrategy;
} & CommonSortContextConfig;

export class SortContext {
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
    if (!this.dndContext.active$.value) {
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

  get container() {
    return this.dndContext.container;
  }

  get dndContext() {
    return this.config.dndContext;
  }

  get items() {
    return this.config.items;
  }

  get strategy() {
    return this.config.strategy;
  }

  constructor(private config: SortContextConfig) {
    effect(() => {
      const list = this.dragSourceList$.value;
      if (list) {
        const transforms = this.strategy({
          rects: list.map(v => v.rect),
          activeNodeRect: this.dndContext.collisionRect$.value,
          activeIndex: list.findIndex(
            v => v.id === this.dndContext.active$.value?.id
          ),
          overIndex: list.findIndex(
            v => v.id === this.dndContext.overId$.value
          ),
        });
        transforms.forEach((transform, i) => {
          const node = list[i].node;
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

export const createSortContext = (
  config: {
    dnd: DndContext | DndContextConfig;
    strategy?: SortingStrategy;
  } & CommonSortContextConfig
) => {
  return new SortContext({
    strategy: horizontalListSortingStrategy,
    ...config,
    dndContext:
      config.dnd instanceof DndContext
        ? config.dnd
        : createDndContext({
            collisionDetection: closestCenter,
            ...config.dnd,
          }),
  });
};
const _sortable = createDataDirective(draggableDataName, droppableDataName);
export const sortable = (id: string) => {
  return _sortable(id, id);
};
