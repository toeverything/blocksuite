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
  UniqueIdentifier,
} from './types.js';
import { add } from './utils/adjustment.js';
import { applyModifiers } from './utils/apply-modifiers.js';
import { closestCenter } from './utils/closest-center.js';
import { createDataDirective } from './utils/data-directive.js';
import { asHTMLElement } from './utils/element.js';
import { getFirstScrollableAncestor } from './utils/get-scrollable-ancestors.js';
import { raf } from './utils/raf.js';
import { getClientRect } from './utils/rect.js';
import { getAdjustedRect } from './utils/rect-adjustment.js';
import { computedCache } from './utils/signal.js';

export interface OverlayData {
  overlay: HTMLElement;
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
const timeWeight = 1 / 16;
const distanceWeight = 2 / 8;
const moveDistance = (diff: number, delta: number) =>
  (diff * distanceWeight + (diff / Math.abs(diff)) * 2) * delta * timeWeight;
const defaultCoordinates: Coordinates = {
  x: 0,
  y: 0,
};

export class DndContext {
  private readonly dragMove = (coordinates: Coordinates) => {
    this.activationCoordinates$.value = coordinates;
    this.autoScroll();
  };

  private readonly droppableNodes$ = signal<DroppableNodes>(new Map());

  private readonly initialCoordinates$ = signal<Coordinates>();

  private readonly initScrollOffset$ = signal(defaultCoordinates);

  private readonly session$ = signal<DndSession>();

  private readonly startSession = (
    id: UniqueIdentifier,
    activeNode: HTMLElement,
    sessionCreator: DndSessionCreator
  ) => {
    this.collectDroppableNodes();
    this.session$.value = sessionCreator({
      onStart: coordinates => {
        const { onDragStart } = this.config;
        const active = {
          id,
          node: activeNode,
          rect: getClientRect(activeNode),
        };
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

  activationCoordinates$ = signal<Coordinates>();

  private readonly translate$ = computed(() => {
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

  collisionRect$ = computed(() => {
    return this.active$.value?.rect
      ? getAdjustedRect(this.active$.value.rect, this.appliedTranslate$.value)
      : undefined;
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

  overlay$ = signal<{
    node: HTMLElement;
    rect: DndClientRect;
  }>();

  scrollableAncestor$ = computed(() => {
    if (!this.active$.value) {
      return;
    }
    const scrollableAncestor = getFirstScrollableAncestor(
      this.active$.value.node
    );
    if (!scrollableAncestor) {
      return;
    }
    return {
      node: scrollableAncestor,
      rect: getClientRect(scrollableAncestor),
      max: {
        x: scrollableAncestor.scrollWidth - scrollableAncestor.clientWidth,
        y: scrollableAncestor.scrollHeight - scrollableAncestor.clientHeight,
      },
    };
  });

  modifiedTranslate$ = computed(() => {
    if (!this.active$.value) {
      return defaultCoordinates;
    }
    return applyModifiers(this.config.modifiers, {
      transform: {
        x: this.translate$.value.x - this.activeNodeRectDelta$.value.x,
        y: this.translate$.value.y - this.activeNodeRectDelta$.value.y,
        scaleX: 1,
        scaleY: 1,
      },
      active: this.active$.value,
      activeNodeRect: this.active$.value.rect,
      over: this.over$.preValue,
      scrollContainerRect: this.scrollableAncestor$.value?.rect,
      overlayNodeRect: this.overlay$.value?.rect,
    });
  });

  scrollOffset$ = signal<Coordinates>(defaultCoordinates);

  appliedTranslate$ = computed(() => {
    return add(this.modifiedTranslate$.value, this.scrollOffset$.value);
  });

  disposables: Array<() => void> = [];

  dragEndCleanupQueue: Array<() => void> = [];

  scale$ = signal<{
    x: number;
    y: number;
  }>({ x: 1, y: 1 });

  scrollAdjustedTranslate$ = computed(() => {
    const translate = this.translate$.value;
    const scrollOffset = this.scrollOffset$.value;
    return add(translate, scrollOffset);
  });

  transform$ = computed<Coordinates>(() => {
    return this.appliedTranslate$.value;
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

  constructor(protected config: DndContextConfig) {
    this.listenActivators();
    this.listenMoveEvent();
    this.listenOverEvent();
  }

  private addActiveClass(node: HTMLElement) {
    const hasClass = node.classList.contains('dnd-active');
    if (hasClass) {
      return;
    }
    node.classList.add('dnd-active');
    this.dragEndCleanupQueue.push(() => {
      node.classList.remove('dnd-active');
    });
  }

  private addTransition(node: HTMLElement) {
    const old = node.style.transition;
    node.style.transition = 'transform 0.2s';
    this.dragEndCleanupQueue.push(() => {
      node.style.transition = old;
    });
  }

  private autoScroll() {
    const currentOverlayRect = this.overlay$.value
      ? getClientRect(this.overlay$.value.node)
      : {
          top: this.activationCoordinates$.value?.y ?? 0,
          left: this.activationCoordinates$.value?.x ?? 0,
          width: 0,
          height: 0,
          bottom: this.activationCoordinates$.value?.y ?? 0,
          right: this.activationCoordinates$.value?.x ?? 0,
        };
    const scrollableAncestor = this.scrollableAncestor$.value;
    if (!scrollableAncestor) {
      return;
    }
    const { node, rect, max } = scrollableAncestor;
    let topDiff = 0;
    let leftDiff = 0;
    if (currentOverlayRect.top < rect.top) {
      topDiff = currentOverlayRect.top - rect.top;
    }
    if (currentOverlayRect.left < rect.left) {
      leftDiff = currentOverlayRect.left - rect.left;
    }
    if (currentOverlayRect.bottom > rect.bottom) {
      topDiff = currentOverlayRect.bottom - rect.bottom;
    }
    if (currentOverlayRect.right > rect.right) {
      leftDiff = currentOverlayRect.right - rect.right;
    }
    if (topDiff || leftDiff) {
      const run = (delta: number) => {
        if (leftDiff) {
          const newScrollLeft = node.scrollLeft + moveDistance(leftDiff, delta);
          if (newScrollLeft < 0) {
            node.scrollLeft = 0;
          } else if (newScrollLeft > max.x) {
            node.scrollLeft = max.x;
          } else {
            node.scrollLeft = newScrollLeft;
          }
        }
        if (topDiff) {
          const newScrollTop = node.scrollTop + moveDistance(topDiff, delta);
          if (newScrollTop < 0) {
            node.scrollTop = 0;
          } else if (newScrollTop > max.y) {
            node.scrollTop = max.y;
          } else {
            node.scrollTop = newScrollTop;
          }
        }
        this.onScroll(node.scrollLeft, node.scrollTop);
        raf(run);
      };
      raf(run);
    } else {
      raf();
    }
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

  private createOverlay(active: Active) {
    const overlay = this.config.createOverlay?.(active);
    if (!overlay) {
      return;
    }
    this.overlay$.value = {
      node: overlay.overlay,
      rect: getClientRect(overlay.overlay),
    };
    this.dragEndCleanupQueue.push(() => {
      overlay.cleanup?.();
    });
  }

  private dragComplete(cancel: boolean = false) {
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

  private dragEndCleanup() {
    this.active$.value?.node.classList?.remove('dnd-active');
    this.activationCoordinates$.value = undefined;
    this.active$.value = undefined;
    this.session$.value = undefined;
    raf();
    this.dragEndCleanupQueue.forEach(f => f());
  }

  private dragStart(active: Active, coordinates: Coordinates) {
    this.active$.value = active;
    this.initialCoordinates$.value = coordinates;
    this.scale$.value = {
      x: active.rect.width / active.node.offsetWidth,
      y: active.rect.height / active.node.offsetHeight,
    };
    this.createOverlay(active);
    this.listenScroll();
    this.addActiveClass(active.node);
    this.setPointerEvents(this.config.container);
    this.droppableNodes$.value.forEach(v => {
      this.addTransition(v.node);
    });
  }

  private getDroppableNode(id: Identifier) {
    if (id == null) {
      return;
    }
    return this.droppableNodes$.value.get(id);
  }

  private listenActivators() {
    const unsubList = this.activators.map(activator => {
      return activator(this.container, this.startSession);
    });
    this.disposables.push(() => {
      unsubList.forEach(unsub => {
        unsub();
      });
    });
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
        if (this.overlay$.value) {
          const transform = this.transform$.value;
          const scale = this.scale$.value;
          this.overlay$.value.node.style.transform = `translate(${transform.x / scale.x}px,${transform.y / scale.y}px)`;
        }
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

  private listenScroll() {
    const scrollAncestor = this.scrollableAncestor$.value?.node;
    if (!scrollAncestor) {
      return;
    }
    this.initScrollOffset$.value = {
      x: scrollAncestor.scrollLeft,
      y: scrollAncestor.scrollTop,
    };
    this.scrollOffset$.value = defaultCoordinates;
    const onScroll = () => {
      this.onScroll(scrollAncestor.scrollLeft, scrollAncestor.scrollTop);
    };
    scrollAncestor.addEventListener('scroll', onScroll);
    this.dragEndCleanupQueue.push(() => {
      scrollAncestor.removeEventListener('scroll', onScroll);
    });
  }

  private onScroll(x: number, y: number) {
    this.scrollOffset$.value = {
      x: (x - this.initScrollOffset$.value.x) * this.scale$.value.x,
      y: (y - this.initScrollOffset$.value.y) * this.scale$.value.y,
    };
  }

  private setPointerEvents(container: HTMLElement) {
    const old = container.style.pointerEvents;
    container.style.pointerEvents = 'none';
    this.dragEndCleanupQueue.push(() => {
      container.style.pointerEvents = old;
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
