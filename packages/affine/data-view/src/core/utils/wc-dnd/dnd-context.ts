import { computed, effect, signal } from '@preact/signals-core';

import type {
  Activators,
  Active,
  CollisionDetection,
  Coordinates,
  DndClientRect,
  DndSession,
  DndSessionCreator,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
  DroppableNodes,
  Modifiers,
  Over,
  Transform,
  UniqueIdentifier,
} from './types.js';

import { applyModifiers } from './utils/apply-modifiers.js';
import { closestCenter } from './utils/closest-center.js';
import { createDataDirective } from './utils/data-directive.js';
import { asHTMLElement } from './utils/element.js';
import { getClientRect } from './utils/rect.js';
import { getAdjustedRect } from './utils/rect-adjustment.js';
import { computedCache } from './utils/signal.js';

export interface OverlayData {
  overlay: Node;
  cleanup?: () => void;
}

export type DndContextConfig = {
  container: HTMLElement;
  collisionDetection?: CollisionDetection;
  modifiers?: Modifiers;
  activators: Activators;
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;
  createOverlay?: (active: Active) => OverlayData | undefined;
};

const defaultCoordinates: Coordinates = {
  x: 0,
  y: 0,
};

export class DndContext {
  private droppableNodes$ = signal<DroppableNodes>(new Map());

  private initialCoordinates$ = signal<Coordinates>();

  private session$ = signal<DndSession>();

  activationCoordinates$ = signal<Coordinates>();

  private translate$ = computed(() => {
    const init = this.initialCoordinates$.value;
    const current = this.activationCoordinates$.value;
    if (!init || !current) {
      return defaultCoordinates;
    }
    return {
      x: current.x - init.x,
      y: current.y - init.y,
    };
  });

  active$ = signal<Active | undefined>();

  activeNodeRect$ = computed<DndClientRect | undefined>(() => {
    const node = this.active$.value?.node;
    if (!node) {
      return;
    }
    return getClientRect(node);
  });

  initActiveRect$ = signal<DndClientRect>();

  activeNodeRectDelta$ = computed(() => {
    const initCoord = this.initialCoordinates$.value;
    const initNodeRect = this.initActiveRect$.value;
    if (!initNodeRect || !initCoord) {
      return defaultCoordinates;
    }
    return {
      x: initCoord.x - initNodeRect.left,
      y: initCoord.y - initNodeRect.top,
    };
  });

  enabledDroppableContainers$ = computed(() => {
    return [...this.droppableNodes$.value.values()].filter(
      node => !node.disabled
    );
  });

  droppableRects$ = computed(() => {
    const map = new Map<UniqueIdentifier, DndClientRect>();
    this.enabledDroppableContainers$.value.forEach(container => {
      const element = container.node;
      if (element) {
        map.set(container.id, container.rect);
      }
    });
    return map;
  });

  collisions$ = computed(() => {
    return this.active$.value && this.collisionRect$.value
      ? this.collisionDetection({
          active: this.active$.value,
          collisionRect: this.collisionRect$.value,
          droppableRects: this.droppableRects$.value,
          droppableContainers: this.enabledDroppableContainers$.value,
          pointerCoordinates: this.activationCoordinates$.value,
        })
      : undefined;
  });

  overId$ = computed(() => {
    return this.collisions$.value?.[0]?.id;
  });

  over$ = computedCache<Over | undefined>(() => {
    const active = this.active$.value;
    if (!active) {
      return;
    }
    const id = this.overId$.value;
    const overContainer = this.getDroppableNode(id);
    return overContainer && overContainer.rect
      ? {
          id: overContainer.id,
          rect: overContainer.rect,
          disabled: overContainer.disabled,
        }
      : undefined;
  });

  modifiedTranslate$ = computed(() => {
    return applyModifiers(this.config.modifiers, {
      transform: {
        x: this.translate$.value.x - this.activeNodeRectDelta$.value.x,
        y: this.translate$.value.y - this.activeNodeRectDelta$.value.y,
        scaleX: 1,
        scaleY: 1,
      },
      active: this.active$.value,
      activeNodeRect: this.activeNodeRect$.value,
      over: this.over$.preValue,
      // overlayNodeRect: dragOverlay.rect,
    });
  });

  // eslint-disable-next-line perfectionist/sort-classes
  collisionRect$ = computed(() => {
    return this.activeNodeRect$.value
      ? getAdjustedRect(
          this.activeNodeRect$.value,
          this.modifiedTranslate$.value
        )
      : undefined;
  });

  disposables: Array<() => void> = [];

  dragEndCleanupQueue: Array<() => void> = [];

  dragMove = (coordinates: Coordinates) => {
    this.activationCoordinates$.value = coordinates;
  };

  overlay$ = signal<HTMLElement>();

  startSession = (
    id: UniqueIdentifier,
    activeNode: HTMLElement,
    sessionCreator: DndSessionCreator
  ) => {
    this.collectDroppableNodes();
    this.session$.value = sessionCreator({
      onStart: coordinates => {
        const { onDragStart } = this.config;
        const active = { id, node: activeNode };
        onDragStart?.({
          active: active,
        });
        this.dragStart(active, coordinates);
      },
      onCancel: this.dragComplete(true),
      onEnd: this.dragComplete(),
      onMove: this.dragMove,
    });
  };

  transform$ = computed<Transform>(() => {
    return this.modifiedTranslate$.value;
  });

  get activators() {
    return this.config.activators;
  }

  get collisionDetection() {
    return this.config.collisionDetection ?? closestCenter;
  }

  get container() {
    return this.config.container;
  }

  constructor(private config: DndContextConfig) {
    this.listenActivators();
    this.listenMoveEvent();
    this.listenOverEvent();
  }

  private collectDroppableNodes() {
    const map: DroppableNodes = new Map();
    const droppableNodes = this.container.querySelectorAll(
      `[${droppableDataName.attribute}]`
    );
    droppableNodes.forEach(node => {
      const ele = asHTMLElement(node);
      const id = ele?.dataset[droppableDataName.dataset];
      if (id) {
        map.set(id, {
          id,
          disabled: false,
          node: ele,
          rect: getClientRect(ele),
        });
      }
    });
    this.droppableNodes$.value = map;
  }

  private getDroppableNode(id: Identifier) {
    if (id == null) {
      return;
    }
    return this.droppableNodes$.value.get(id);
  }

  private listenMoveEvent() {
    this.disposables.push(
      effect(() => {
        const active = this.active$.value;
        if (!active) {
          return;
        }
        const translate = this.modifiedTranslate$.value;
        this.config.onDragMove?.({
          active,
          collisions: this.collisions$.value,
          delta: {
            x: translate.x,
            y: translate.y,
          },
          over: this.over$.value,
        });
      })
    );
  }

  private listenOverEvent() {
    this.disposables.push(
      effect(() => {
        if (!this.active$.value) {
          return;
        }
        this.config.onDragOver?.({
          active: this.active$.value,
          collisions: this.collisions$.peek(),
          delta: {
            x: this.modifiedTranslate$.peek().x,
            y: this.modifiedTranslate$.peek().y,
          },
          over: this.over$.value,
        });
      })
    );
  }

  createOverlay(active: Active) {
    const overlay = this.config.createOverlay?.(active);
    if (!overlay) {
      return;
    }
    const div = document.createElement('div');
    div.append(overlay.overlay);
    this.overlay$.value = div;
    this.dragEndCleanupQueue.push(() => {
      overlay.cleanup?.();
    });
  }

  dragComplete(cancel: boolean = false) {
    return () => {
      let event: DragEndEvent | null = null;
      const active = this.active$.peek();
      if (active && this.modifiedTranslate$.value) {
        event = {
          active: active,
          collisions: this.collisions$.peek(),
          delta: this.modifiedTranslate$.peek(),
          over: this.over$.peek(),
        };
      }
      this.dragEndCleanup();
      if (event) {
        this.config[cancel ? 'onDragCancel' : 'onDragEnd']?.(event);
      }
    };
  }

  dragEndCleanup() {
    this.active$.value?.node.classList?.remove('dnd-active');
    this.activationCoordinates$.value = undefined;
    this.active$.value = undefined;
    this.session$.value = undefined;
    this.dragEndCleanupQueue.forEach(f => f());
  }

  dragStart(active: Active, coordinates: Coordinates) {
    this.active$.value = active;
    this.initialCoordinates$.value = coordinates;
    this.createOverlay(active);
    active.node.classList.add('dnd-active');
    const style = this.config.container.style;
    const pointerEvents = style.pointerEvents;
    style.pointerEvents = 'none';
    const clearups = [...this.droppableNodes$.value.values()].map(v => {
      const old = v.node.style.transition;
      v.node.style.transition = 'transform 0.2s';
      return () => {
        v.node.style.transition = old;
      };
    });
    this.dragEndCleanupQueue.push(() => {
      style.pointerEvents = pointerEvents;
      clearups.forEach(f => f());
    });
  }

  listenActivators() {
    const unsubList = this.activators.map(activator => {
      return activator(this.container, this.startSession);
    });
    this.disposables.push(() => {
      unsubList.forEach(unsub => {
        unsub();
      });
    });
  }
}

type Identifier = UniqueIdentifier | null | undefined;

export const createDndContext = (config: DndContextConfig) => {
  return new DndContext(config);
};
export const draggableDataName = {
  dataset: 'wcDndDraggableId',
  attribute: 'data-wc-dnd-draggable-id',
};

export const draggable = createDataDirective(draggableDataName);

export const dragHandlerDataName = {
  dataset: 'wcDndDragHandlerId',
  attribute: 'data-wc-dnd-drag-handler-id',
};

export const dragHandler = createDataDirective(dragHandlerDataName);

export const droppableDataName = {
  dataset: 'wcDndDroppableId',
  attribute: 'data-wc-dnd-droppable-id',
};

export const droppable = createDataDirective(droppableDataName);
