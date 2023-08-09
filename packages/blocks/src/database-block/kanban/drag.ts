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

  override connectedCallback() {
    super.connectedCallback();
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
    const dropPreview = createDropPreview();
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
        const eles = document.elementsFromPoint(evt.x, evt.y);
        const target = eles.find(v => v instanceof KanbanGroup);
        if (target) {
          const group = target.closest('affine-data-view-kanban-group');
          if (group && group !== currentGroup) {
            const card = getCardByPoint(group, evt.y);
            dropPreview.display(group, card);
            return {
              drop: {
                key: group.group.key,
                position: card
                  ? {
                      before: true,
                      id: card.cardId,
                    }
                  : 'end',
              },
            };
          }
        }
        dropPreview.remove();
        return {};
      },
      onDrop: ({ drop }) => {
        preview.remove();
        dropPreview.remove();
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
  const parent = card.offsetParent;
  assertExists(parent);
  const parentRect = parent.getBoundingClientRect();
  div.append(kanbanCard);
  div.style.width = `${card.getBoundingClientRect().width}px`;
  div.style.position = 'absolute';
  // div.style.pointerEvents = 'none';
  div.style.transform = 'rotate(-3deg)';
  div.style.left = `${x - parentRect.left}px`;
  div.style.top = `${y - parentRect.top}px`;
  div.style.zIndex = '999';
  card.closest('affine-data-view-kanban')?.append(div);
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
    display(group: KanbanGroup, card?: KanbanCard) {
      const target = card ?? group.querySelector('.add-card');
      assertExists(target);
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
