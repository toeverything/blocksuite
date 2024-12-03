import type { InsertToPosition } from '@blocksuite/affine-shared/utils';
import type { ReactiveController } from 'lit';

import { assertExists, Point, Rect } from '@blocksuite/global/utils';
import { computed } from '@preact/signals-core';

import type { MobileDataViewKanban } from '../kanban-view.js';

import { autoScrollOnBoundary } from '../../../../core/utils/auto-scroll.js';
import { startDrag } from '../../../../core/utils/drag.js';
import { MobileKanbanCard } from '../card.js';
import { MobileKanbanGroup } from '../group.js';

export class MobileKanbanDragController implements ReactiveController {
  dragStart = (ele: MobileKanbanCard, evt: PointerEvent) => {
    const eleRect = ele.getBoundingClientRect();
    const offsetLeft = evt.x - eleRect.left;
    const offsetTop = evt.y - eleRect.top;
    const preview = createDragPreview(
      ele,
      evt.x - offsetLeft,
      evt.y - offsetTop
    );
    const currentGroup = ele.closest('mobile-kanban-group');
    const drag = startDrag<
      | { type: 'out'; callback: () => void }
      | {
          type: 'self';
          key: string;
          position: InsertToPosition;
        }
      | undefined,
      PointerEvent
    >(evt, {
      onDrag: () => undefined,
      onMove: evt => {
        if (!(evt.target instanceof HTMLElement)) {
          return;
        }
        preview.display(evt.x - offsetLeft, evt.y - offsetTop);
        if (!Rect.fromDOM(this.host).isPointIn(Point.from(evt))) {
          const callback = this.host.props.onDrag;
          if (callback) {
            this.dropPreview.remove();
            return {
              type: 'out',
              callback: callback(evt, ele.cardId),
            };
          }
          return;
        }
        const result = this.shooIndicator(evt, ele);
        if (result) {
          return {
            type: 'self',
            key: result.group.group.key,
            position: result.position,
          };
        }
        return;
      },
      onClear: () => {
        preview.remove();
        this.dropPreview.remove();
        cancelScroll();
      },
      onDrop: result => {
        if (!result) {
          return;
        }
        if (result.type === 'out') {
          result.callback();
          return;
        }
        if (result && currentGroup) {
          currentGroup.group.manager.moveCardTo(
            ele.cardId,
            currentGroup.group.key,
            result.key,
            result.position
          );
        }
      },
    });
    const cancelScroll = autoScrollOnBoundary(
      this.scrollContainer,
      computed(() => {
        return {
          left: drag.mousePosition.value.x,
          right: drag.mousePosition.value.x,
          top: drag.mousePosition.value.y,
          bottom: drag.mousePosition.value.y,
        };
      })
    );
  };

  dropPreview = createDropPreview();

  getInsertPosition = (
    evt: MouseEvent
  ):
    | { group: MobileKanbanGroup; card?: MobileKanbanCard; position: InsertToPosition }
    | undefined => {
    const eles = document.elementsFromPoint(evt.x, evt.y);
    const target = eles.find(v => v instanceof MobileKanbanGroup) as MobileKanbanGroup;
    if (target) {
      const card = getCardByPoint(target, evt.y);
      return {
        group: target,
        card,
        position: card
          ? {
              before: true,
              id: card.cardId,
            }
          : 'end',
      };
    } else {
      return;
    }
  };

  shooIndicator = (
    evt: MouseEvent,
    self: MobileKanbanCard | undefined
  ): { group: MobileKanbanGroup; position: InsertToPosition } | undefined => {
    const position = this.getInsertPosition(evt);
    if (position) {
      this.dropPreview.display(position.group, self, position.card);
    } else {
      this.dropPreview.remove();
    }
    return position;
  };

  get scrollContainer() {
    const scrollContainer = this.host.querySelector(
      '.mobile-kanban-groups'
    ) as HTMLElement;
    assertExists(scrollContainer);
    return scrollContainer;
  }

  constructor(private host: MobileDataViewKanban) {
    this.host.addController(this);
  }

  hostConnected() {
    if (this.host.props.view.readonly$.value) {
      return;
    }
    this.host.disposables.add(
      this.host.props.handleEvent('dragStart', context => {
        const event = context.get('pointerState').raw;
        const target = event.target;
        if (target instanceof Element) {
          const cell = target.closest('mobile-kanban-cell');
          if (cell?.isEditing) {
            return;
          }
          cell?.selectCurrentCell(false);
          const card = target.closest('mobile-kanban-card');
          if (card) {
            this.dragStart(card, event);
          }
        }
        return true;
      })
    );
  }
}

const createDragPreview = (card: MobileKanbanCard, x: number, y: number) => {
  const preOpacity = card.style.opacity;
  card.style.opacity = '0.5';
  const div = document.createElement('div');
  const kanbanCard = new MobileKanbanCard();
  kanbanCard.cardId = card.cardId;
  kanbanCard.view = card.view;
  kanbanCard.isFocus = true;
  kanbanCard.style.backgroundColor = 'var(--affine-background-primary-color)';
  div.append(kanbanCard);
  div.className = 'with-data-view-css-variable';
  div.style.width = `${card.getBoundingClientRect().width}px`;
  div.style.position = 'fixed';
  // div.style.pointerEvents = 'none';
  div.style.transform = 'rotate(-3deg)';
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.zIndex = '9999';
  document.body.append(div);
  return {
    display(x: number, y: number) {
      div.style.left = `${Math.round(x)}px`;
      div.style.top = `${Math.round(y)}px`;
    },
    remove() {
      card.style.opacity = preOpacity;
      div.remove();
    },
  };
};
const createDropPreview = () => {
  const div = document.createElement('div');
  div.style.height = '2px';
  div.style.borderRadius = '1px';
  div.style.backgroundColor = 'var(--affine-primary-color)';
  div.style.boxShadow = '0px 0px 8px 0px rgba(30, 150, 235, 0.35)';
  return {
    display(
      group: MobileKanbanGroup,
      self: MobileKanbanCard | undefined,
      card?: MobileKanbanCard
    ) {
      const target = card ?? group.querySelector('.add-card');
      assertExists(target);
      if (target.previousElementSibling === self || target === self) {
        div.remove();
        return;
      }
      if (target.previousElementSibling === div) {
        return;
      }
      target.insertAdjacentElement('beforebegin', div);
    },
    remove() {
      div.remove();
    },
  };
};

const getCardByPoint = (
  group: MobileKanbanGroup,
  y: number
): MobileKanbanCard | undefined => {
  const cards = Array.from(
    group.querySelectorAll('mobile-kanban-card')
  );
  const positions = cards.map(v => {
    const rect = v.getBoundingClientRect();
    return (rect.top + rect.bottom) / 2;
  });
  const index = positions.findIndex(v => v > y);
  return cards[index];
};
