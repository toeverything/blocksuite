// related component

import type { UIEventDispatcher } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { PropertyValues } from 'lit';
import { css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { startDrag } from '../utils/drag.js';
import { KanbanCard } from './card.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-drag {
    background-color: var(--affine-background-primary-color);
  }
`;

@customElement('affine-data-view-kanban-drag')
export class KanbanDrag extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  dispatcher!: UIEventDispatcher;

  @query('.drag-preview')
  dragPreview!: HTMLDivElement;

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    this._disposables.add({
      dispose: this.dispatcher.add('dragStart', context => {
        const event = context.get('pointerState').raw;
        const target = event.target;
        if (target instanceof Element) {
          const card = target.closest('affine-data-view-kanban-card');
          if (card) {
            this.dragStart(card, event);
            return true;
          }
        }
        return false;
      }),
    });
  }

  dragStart = (ele: KanbanCard, evt: PointerEvent) => {
    const preview = createDragPreview(ele, evt.x, evt.y);
    const currentGroup = ele.closest('affine-data-view-kanban-group');
    startDrag<
      {
        change: boolean;
        value?: unknown;
      },
      PointerEvent
    >(evt, {
      onDrag: () => ({ change: false }),
      onMove: evt => {
        preview.display(evt.x, evt.y);
        const target = evt.target;
        if (target instanceof Element) {
          const group = target.closest('affine-data-view-kanban-group');
          if (group !== currentGroup) {
            return {
              change: true,
              value: group?.group.value,
            };
          }
        }
        return {
          change: false,
        };
      },
      onDrop: ({ change, value }) => {
        preview.remove();
        if (change && currentGroup) {
          currentGroup.group.helper.moveTo(
            ele.cardId,
            currentGroup.group.value,
            value
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
  const div = document.createElement('div');
  const kanbanCard = new KanbanCard();
  kanbanCard.cardId = card.cardId;
  kanbanCard.view = card.view;
  div.append(kanbanCard);
  div.style.width = '200px';
  div.style.backgroundColor = 'var(--affine-background-primary-color)';
  div.style.pointerEvents = 'none';
  div.style.position = 'absolute';
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  div.style.zIndex = '999';
  card.closest('affine-data-view-kanban')?.append(div);
  return {
    display(x: number, y: number) {
      div.style.left = `${Math.round(x)}px`;
      div.style.top = `${Math.round(y)}px`;
    },
    remove() {
      div.remove();
    },
  };
};

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-drag': KanbanDrag;
  }
}
