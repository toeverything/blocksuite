// related component

import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { InsertPosition } from '../types.js';
import { startDrag } from '../utils/drag.js';
import { KanbanCard } from './card.js';
import { KanbanGroup } from './group.js';
import type { DataViewKanban } from './kanban-view.js';

const styles = css`
  affine-data-view-kanban-drag {
    background-color: var(--affine-background-primary-color);
  }
`;

@customElement('affine-data-view-kanban-drag')
export class KanbanDrag extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  kanbanView!: DataViewKanban;

  @query('.drag-preview')
  dragPreview!: HTMLDivElement;

  dropPreview = createDropPreview();

  getInsertPosition = (
    evt: MouseEvent
  ):
    | { group: KanbanGroup; card?: KanbanCard; position: InsertPosition }
    | undefined => {
    const eles = document.elementsFromPoint(evt.x, evt.y);
    const target = eles.find(v => v instanceof KanbanGroup) as KanbanGroup;
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
    self: KanbanCard | undefined
  ): { group: KanbanGroup; position: InsertPosition } | undefined => {
    const position = this.getInsertPosition(evt);
    if (position) {
      this.dropPreview.display(position.group, self, position.card);
    } else {
      this.dropPreview.remove();
    }
    return position;
  };

  override connectedCallback() {
    super.connectedCallback();
    if (this.kanbanView.view.readonly) {
      return;
    }
    this._disposables.add(
      this.kanbanView.handleEvent('dragStart', context => {
        const event = context.get('pointerState').raw;
        const target = event.target;
        if (target instanceof Element) {
          const card = target.closest('affine-data-view-kanban-card');
          if (card) {
            this.dragStart(card, event);
          }
        }
        return true;
      })
    );
  }

  dragStart = (ele: KanbanCard, evt: PointerEvent) => {
    const eleRect = ele.getBoundingClientRect();
    const offsetLeft = evt.x - eleRect.left;
    const offsetTop = evt.y - eleRect.top;
    const preview = createDragPreview(
      ele,
      evt.x - offsetLeft,
      evt.y - offsetTop
    );
    const currentGroup = ele.closest('affine-data-view-kanban-group');
    startDrag<
      {
        drop?: {
          key: string;
          position: InsertPosition;
        };
      },
      PointerEvent
    >(evt, {
      onDrag: () => ({}),
      onMove: evt => {
        preview.display(evt.x - offsetLeft, evt.y - offsetTop);
        const result = this.shooIndicator(evt, ele);
        if (result) {
          return {
            drop: {
              key: result.group.group.key,
              position: result.position,
            },
          };
        }
        return {};
      },
      onClear: () => {
        preview.remove();
        this.dropPreview.remove();
      },
      onDrop: ({ drop }) => {
        preview.remove();
        this.dropPreview.remove();
        if (drop && currentGroup) {
          currentGroup.group.helper.moveCardTo(
            ele.cardId,
            currentGroup.group.key,
            drop.key,
            drop.position
          );
        }
      },
    });
  };

  override render() {
    return html` <div class="drag-preview"></div> `;
  }
}

const createDragPreview = (card: KanbanCard, x: number, y: number) => {
  const preOpacity = card.style.opacity;
  card.style.opacity = '0.5';
  const div = document.createElement('div');
  const kanbanCard = new KanbanCard();
  kanbanCard.cardId = card.cardId;
  kanbanCard.view = card.view;
  kanbanCard.isFocus = true;
  kanbanCard.style.backgroundColor = 'var(--affine-background-primary-color)';
  div.append(kanbanCard);
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
  div.style.height = '4px';
  div.style.borderRadius = '2px';
  div.style.backgroundColor = 'var(--affine-primary-color)';
  div.style.boxShadow = '0px 0px 8px 0px rgba(30, 150, 235, 0.35)';
  return {
    display(
      group: KanbanGroup,
      self: KanbanCard | undefined,
      card?: KanbanCard
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
  group: KanbanGroup,
  y: number
): KanbanCard | undefined => {
  const cards = Array.from(
    group.querySelectorAll('affine-data-view-kanban-card')
  );
  const positions = cards.map(v => {
    const rect = v.getBoundingClientRect();
    return (rect.top + rect.bottom) / 2;
  });
  const index = positions.findIndex(v => v > y);
  return cards[index];
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-drag': KanbanDrag;
  }
}
