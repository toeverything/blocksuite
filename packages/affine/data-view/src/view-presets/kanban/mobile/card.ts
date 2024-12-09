import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { CenterPeekIcon, MoreHorizontalIcon } from '@blocksuite/icons/lit';
import { css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { DataViewRenderer } from '../../../core/data-view.js';
import type { KanbanColumn, KanbanSingleView } from '../kanban-view-manager.js';

import { popCardMenu } from './menu.js';

const styles = css`
  mobile-kanban-card {
    display: flex;
    position: relative;
    flex-direction: column;
    border: 0.5px solid var(--affine-border-color);
    box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    background-color: var(--affine-background-primary-color);
  }

  .mobile-card-header {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mobile-card-header-title uni-lit {
    width: 100%;
  }

  .mobile-card-header.has-divider {
    border-bottom: 0.5px solid var(--affine-border-color);
  }

  .mobile-card-header-title {
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
  }

  .mobile-card-header-icon {
    padding: 4px;
    background-color: var(--affine-background-secondary-color);
    display: flex;
    align-items: center;
    border-radius: 4px;
    width: max-content;
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }

  .mobile-card-body {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }

  mobile-kanban-card:has([data-editing='true']) .card-ops {
    visibility: hidden;
  }

  .mobile-card-ops {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    gap: 4px;
  }

  .mobile-card-op {
    display: flex;
    position: relative;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    background-color: var(--affine-background-primary-color);
    font-size: 16px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }

  mobile-kanban-card.dragging {
    opacity: 0.6;
    transform: scale(1.02);
    box-shadow: var(--affine-shadow-2);
    pointer-events: none;
    position: relative;
    z-index: 1000;
    background-color: var(--affine-background-primary-color);
  }

  mobile-kanban-card.drag-over {
    position: relative;
  }

  mobile-kanban-card.drag-over::before {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    height: 2px;
    background: var(--affine-primary-color);
    z-index: 1;
  }

  mobile-kanban-card.drag-over-top::before {
    top: -6px;
  }

  mobile-kanban-card.drag-over-bottom::before {
    bottom: -6px;
  }

  .mobile-group-body.drag-over::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--affine-primary-color);
    z-index: 1;
    top: 50%;
  }

  .mobile-add-card {
    position: relative;
  }

  .mobile-add-card.drag-over::before {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    height: 2px;
    background: var(--affine-primary-color);
    z-index: 1;
    top: -6px;
  }
`;

export class MobileKanbanCard extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private clickCenterPeek = (e: MouseEvent) => {
    e.stopPropagation();
    this.dataViewEle.openDetailPanel({
      view: this.view,
      rowId: this.cardId,
    });
  };

  private clickMore = (e: MouseEvent) => {
    e.stopPropagation();
    popCardMenu(
      popupTargetFromElement(e.currentTarget as HTMLElement),
      this.view,
      this.groupKey,
      this.cardId,
      this.dataViewEle
    );
  };

  private currentTouch: Touch | null = null;

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.classList.remove('dragging');

      // 重置 transform
      this.style.transform = '';

      // 获取目标（可能是卡片或空 group）
      const target = document.querySelector(
        '.drag-over-top, .drag-over-bottom, .mobile-group-body.drag-over'
      ) as HTMLElement;

      if (target) {
        // 获取目标所在的 group
        const targetGroup = target.closest(
          'mobile-kanban-group'
        ) as HTMLElement;
        const targetGroupKey = targetGroup?.dataset.key;

        const event = new CustomEvent('dragend', {
          detail: {
            targetId: target.classList.contains('mobile-group-body')
              ? null
              : target.dataset.cardId,
            position: target.classList.contains('drag-over-top')
              ? 'top'
              : 'bottom',
            targetGroupKey: targetGroupKey,
          },
          bubbles: true,
          composed: true,
        });

        this.dispatchEvent(event);
      }

      // 清除所有提示样式
      document
        .querySelectorAll('.drag-over, .drag-over-top, .drag-over-bottom')
        .forEach(el => {
          el.classList.remove('drag-over');
          el.classList.remove('drag-over-top');
          el.classList.remove('drag-over-bottom');
        });
    }

    // 停止自动滚动
    this.stopAutoScroll();
    this.currentTouch = null;

    // 重置所有状态
    this.scrollOffset = { x: 0, y: 0 };
    this.initialPosition = { x: 0, y: 0 };
    this.touchOffset = { x: 0, y: 0 };
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) {
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout);
        this.longPressTimeout = null;
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    this.currentTouch = touch;

    // Calculate base movement distance
    const deltaX =
      touch.clientX - (this.initialPosition.x + this.touchOffset.x);
    const deltaY =
      touch.clientY - (this.initialPosition.y + this.touchOffset.y);

    // Calculate scroll offset
    const horizontalContainer = this.findScrollableParent(this, 'horizontal');
    const verticalContainer = this.findScrollableParent(this, 'vertical');
    const scrollLeft = horizontalContainer?.scrollLeft || 0;
    const scrollTop = verticalContainer?.scrollTop || 0;
    const scrollDeltaX = scrollLeft - this.initialScroll.x;
    const scrollDeltaY = scrollTop - this.initialScroll.y;

    // Use transform to move card with scroll offset
    this.style.transform = `translate(${deltaX + scrollDeltaX}px, ${deltaY + scrollDeltaY}px) scale(1.02)`;

    // Start auto scroll
    this.startAutoScroll();

    // Get all groups
    const allGroups = Array.from(
      document.querySelectorAll('mobile-kanban-group')
    ) as HTMLElement[];

    // Clear all previous indicator styles
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });

    // Get the element under touch point
    const elementUnderTouch = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const cardUnderTouch = elementUnderTouch?.closest(
      'mobile-kanban-card'
    ) as HTMLElement;

    // Don't show indicator if touching the dragging card itself
    if (
      elementUnderTouch === this ||
      this.contains(elementUnderTouch) ||
      (cardUnderTouch && cardUnderTouch.dataset.cardId === this.cardId)
    ) {
      return;
    }

    // Find the group under touch point
    let targetGroup: HTMLElement | null = null;
    for (const group of allGroups) {
      const rect = group.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        targetGroup = group;
        break;
      }
    }

    if (!targetGroup) {
      return;
    }

    // Get all cards in target group
    const cards = Array.from(
      targetGroup.querySelectorAll('mobile-kanban-card')
    ).filter(card => card !== this) as HTMLElement[];

    let closestCard: HTMLElement | null = null;
    let position: 'top' | 'bottom' = 'bottom';

    const groupBody = targetGroup.querySelector(
      '.mobile-group-body'
    ) as HTMLElement;
    if (!groupBody) return;

    const groupRect = groupBody.getBoundingClientRect();

    if (cards.length === 0) {
      // Handle empty group case
      if (touch.clientY >= groupRect.top && touch.clientY <= groupRect.bottom) {
        const addCardButton = targetGroup.querySelector(
          '.mobile-add-card'
        ) as HTMLElement;
        if (addCardButton) {
          // Only show indicator when dragging to a different group
          if (targetGroup.dataset.key !== this.groupKey) {
            addCardButton.classList.add('drag-over');
            closestCard = addCardButton;
            position = 'top';
          }
        }
      }
    } else {
      // Get current card's position in target group
      const currentIndex = cards.findIndex(
        card => card.dataset.cardId === this.cardId
      );
      const isInSameGroup = targetGroup.dataset.key === this.groupKey;

      // Check if touching above first card
      const firstCard = cards[0];
      const firstCardRect = firstCard.getBoundingClientRect();

      if (touch.clientY < firstCardRect.top) {
        // Show indicator if not the first card or in different group
        if (!isInSameGroup || currentIndex > 0) {
          closestCard = firstCard;
          position = 'top';
        }
      }
      // Check if touching below last card
      else {
        const lastCard = cards[cards.length - 1];
        const lastCardRect = lastCard.getBoundingClientRect();

        if (touch.clientY > lastCardRect.bottom) {
          // Show indicator if not the last card or in different group
          if (!isInSameGroup || currentIndex < cards.length - 1) {
            closestCard = lastCard;
            position = 'bottom';
          }
        }
        // Between cards
        else {
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const rect = card.getBoundingClientRect();

            if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
              const midY = rect.top + rect.height / 2;

              if (isInSameGroup) {
                // In same group
                if (touch.clientY < midY) {
                  // Upper half: can't be next card of current card
                  if (i !== currentIndex + 1 || currentIndex === 0) {
                    closestCard = card;
                    position = 'top';
                  }
                } else {
                  // Lower half: can't be previous card of current card
                  if (
                    i !== currentIndex - 1 ||
                    currentIndex === cards.length - 1
                  ) {
                    closestCard = card;
                    position = 'bottom';
                  }
                }
              } else {
                // Different group, no restrictions
                closestCard = card;
                position = touch.clientY < midY ? 'top' : 'bottom';
              }
              break;
            }
          }
        }
      }
    }

    // Show drop indicator
    if (closestCard) {
      closestCard.classList.add('drag-over', `drag-over-${position}`);
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (this.view.readonly$.value) return;

    e.stopPropagation();

    const touch = e.touches[0];
    const rect = this.getBoundingClientRect();

    this.touchOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };

    // Record initial scroll position
    const horizontalContainer = this.findScrollableParent(this, 'horizontal');
    const verticalContainer = this.findScrollableParent(this, 'vertical');
    this.initialScroll = {
      x: horizontalContainer?.scrollLeft || 0,
      y: verticalContainer?.scrollTop || 0,
    };

    this.longPressTimeout = window.setTimeout(() => {
      this.isDragging = true;
      this.classList.add('dragging');

      // Record initial position
      this.initialPosition = {
        x: rect.left,
        y: rect.top,
      };

      // Dispatch drag start event
      const event = new CustomEvent('dragstart', {
        detail: {
          cardId: this.cardId,
          groupKey: this.groupKey,
        },
        bubbles: true,
        composed: true,
      });

      this.dispatchEvent(event);
    }, 150);
  };

  private initialPosition = {
    x: 0,
    y: 0,
  };

  private initialScroll = {
    x: 0,
    y: 0,
  };

  private isDragging = false;

  private lastScrollPosition = {
    x: 0,
    y: 0,
  };

  private longPressTimeout: number | null = null;

  private readonly MAX_SCROLL_SPEED = 15; // Maximum scroll speed

  private readonly MIN_SCROLL_SPEED = 2; // Minimum scroll speed

  private readonly SCROLL_EDGE_SIZE = 100; // Edge trigger area size

  private scrollAnimationFrame: number | null = null;

  private scrollOffset = {
    x: 0,
    y: 0,
  };

  private startAutoScroll = () => {
    if (this.scrollAnimationFrame) return;

    const scroll = () => {
      if (!this.isDragging || !this.currentTouch) {
        this.stopAutoScroll();
        return;
      }

      const touch = this.currentTouch;
      const verticalContainer = this.findScrollableParent(this, 'vertical');
      const horizontalContainer = this.findScrollableParent(this, 'horizontal');

      let scrollX = 0;
      let scrollY = 0;

      if (verticalContainer) {
        const viewportHeight = window.innerHeight;
        const distanceFromTop = touch.clientY;
        const distanceFromBottom = viewportHeight - touch.clientY;

        if (distanceFromTop < this.SCROLL_EDGE_SIZE) {
          scrollY = -this.calculateScrollSpeed(distanceFromTop);
        } else if (distanceFromBottom < this.SCROLL_EDGE_SIZE) {
          scrollY = this.calculateScrollSpeed(distanceFromBottom);
        }

        if (scrollY !== 0) {
          verticalContainer.scrollTop += scrollY;
        }
      }

      if (horizontalContainer) {
        const rect = horizontalContainer.getBoundingClientRect();
        const distanceFromLeft = touch.clientX - rect.left;
        const distanceFromRight = rect.right - touch.clientX;

        if (distanceFromLeft < this.SCROLL_EDGE_SIZE) {
          scrollX = -this.calculateScrollSpeed(distanceFromLeft);
        } else if (distanceFromRight < this.SCROLL_EDGE_SIZE) {
          scrollX = this.calculateScrollSpeed(distanceFromRight);
        }

        if (scrollX !== 0) {
          horizontalContainer.scrollLeft += scrollX;
        }
      }

      // 更新卡片位置
      if (scrollX !== 0 || scrollY !== 0) {
        const deltaX =
          touch.clientX - (this.initialPosition.x + this.touchOffset.x);
        const deltaY =
          touch.clientY - (this.initialPosition.y + this.touchOffset.y);
        const scrollLeft = horizontalContainer?.scrollLeft || 0;
        const scrollTop = verticalContainer?.scrollTop || 0;
        const scrollDeltaX = scrollLeft - this.initialScroll.x;
        const scrollDeltaY = scrollTop - this.initialScroll.y;

        this.style.transform = `translate(${deltaX + scrollDeltaX}px, ${deltaY + scrollDeltaY}px) scale(1.02)`;

        // 触发一个新的 touchmove 事件来更新插入位置
        const touchMoveEvent = new TouchEvent('touchmove', {
          touches: [
            new Touch({
              identifier: touch.identifier,
              target: touch.target as EventTarget,
              clientX: touch.clientX,
              clientY: touch.clientY,
              screenX: touch.screenX,
              screenY: touch.screenY,
              pageX: touch.pageX,
              pageY: touch.pageY,
              radiusX: touch.radiusX,
              radiusY: touch.radiusY,
              rotationAngle: touch.rotationAngle,
              force: touch.force,
            }),
          ],
        });
        this.handleTouchMove(touchMoveEvent);
      }

      this.scrollAnimationFrame = requestAnimationFrame(() => scroll());
    };

    this.scrollAnimationFrame = requestAnimationFrame(scroll);
  };

  private touchOffset = {
    x: 0,
    y: 0,
  };

  private calculateScrollSpeed(distance: number): number {
    // 使用线性插值计算速度，让速度变化更平滑
    const normalizedDistance = Math.max(
      0,
      Math.min(distance, this.SCROLL_EDGE_SIZE)
    );
    const factor = 1 - normalizedDistance / this.SCROLL_EDGE_SIZE;
    return (
      this.MIN_SCROLL_SPEED +
      (this.MAX_SCROLL_SPEED - this.MIN_SCROLL_SPEED) * factor
    );
  }

  private findScrollableParent(
    element: Element,
    direction: 'vertical' | 'horizontal'
  ): Element | null {
    if (!element) return null;

    const style = window.getComputedStyle(element);
    const overflow =
      direction === 'vertical' ? style.overflowY : style.overflowX;

    // Check if element is actually scrollable
    if (
      (overflow === 'auto' || overflow === 'scroll') &&
      (direction === 'vertical'
        ? element.scrollHeight > element.clientHeight
        : element.scrollWidth > element.clientWidth)
    ) {
      return element;
    }

    if (element.parentElement) {
      return this.findScrollableParent(element.parentElement, direction);
    }

    return document.scrollingElement as Element;
  }

  private renderBody(columns: KanbanColumn[]) {
    if (columns.length === 0) {
      return '';
    }
    return html` <div class="mobile-card-body">
      ${repeat(
        columns,
        v => v.id,
        column => {
          if (this.view.isInHeader(column.id)) {
            return '';
          }

          // Get field value
          const cell = column.cellGet(this.cardId);
          const value = cell.value$.value;

          // Skip empty fields
          if (
            value == null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'object' && Object.keys(value).length === 0)
          ) {
            return '';
          }

          return html` <mobile-kanban-cell
            .contentOnly="${false}"
            data-column-id="${column.id}"
            .view="${this.view}"
            .groupKey="${this.groupKey}"
            .column="${column}"
            .cardId="${this.cardId}"
          ></mobile-kanban-cell>`;
        }
      )}
    </div>`;
  }

  private renderHeader(columns: KanbanColumn[]) {
    if (!this.view.hasHeader(this.cardId)) {
      return '';
    }
    const classList = classMap({
      'mobile-card-header': true,
      'mobile-has-divider': columns.length > 0,
    });
    return html`
      <div class="${classList}">${this.renderTitle()} ${this.renderIcon()}</div>
    `;
  }

  private renderIcon() {
    const icon = this.view.getHeaderIcon(this.cardId);
    if (!icon) {
      return;
    }
    return html` <div class="mobile-card-header-icon">
      ${icon.cellGet(this.cardId).value$.value}
    </div>`;
  }

  private renderOps() {
    if (this.view.readonly$.value) {
      return;
    }
    return html`
      <div class="mobile-card-ops">
        <div class="mobile-card-op" @click="${this.clickCenterPeek}">
          ${CenterPeekIcon()}
        </div>
        <div class="mobile-card-op" @click="${this.clickMore}">
          ${MoreHorizontalIcon()}
        </div>
      </div>
    `;
  }

  private renderTitle() {
    const title = this.view.getHeaderTitle(this.cardId);
    if (!title) {
      return;
    }
    return html` <div class="mobile-card-header-title">
      <mobile-kanban-cell
        .contentOnly="${true}"
        data-column-id="${title.id}"
        .view="${this.view}"
        .groupKey="${this.groupKey}"
        .column="${title}"
        .cardId="${this.cardId}"
      ></mobile-kanban-cell>
    </div>`;
  }

  private stopAutoScroll() {
    if (this.scrollAnimationFrame) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    // Add touch event listeners with passive: false to allow preventDefault
    this.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    this.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.addEventListener('contextmenu', e => e.preventDefault());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.stopAutoScroll();
    this.removeEventListener('touchstart', this.handleTouchStart);
    this.removeEventListener('touchmove', this.handleTouchMove);
    this.removeEventListener('touchend', this.handleTouchEnd);
  }

  override render() {
    const columns = this.view.properties$.value.filter(
      v => !this.view.isInHeader(v.id)
    );
    return html`
      ${this.renderHeader(columns)} ${this.renderBody(columns)}
      ${this.renderOps()}
    `;
  }

  @property({ attribute: false })
  accessor cardId!: string;

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor groupKey!: string;

  @state()
  accessor isFocus = false;

  @property({ attribute: false })
  accessor view!: KanbanSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'mobile-kanban-card': MobileKanbanCard;
  }
}
