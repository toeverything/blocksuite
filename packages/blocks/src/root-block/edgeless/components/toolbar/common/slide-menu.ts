import { WithDisposable } from '@blocksuite/block-std';
import { consume } from '@lit/context';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ArrowRightSmallIcon } from '../../../../../_common/icons/index.js';
import {
  type EdgelessToolbarSlots,
  edgelessToolbarSlotsContext,
} from '../context.js';

@customElement('edgeless-slide-menu')
export class EdgelessSlideMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      max-width: 100%;
    }
    ::-webkit-scrollbar {
      display: none;
    }
    .slide-menu-wrapper {
      position: relative;
    }
    .menu-container {
      background: var(--affine-background-overlay-panel-color);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--affine-border-color);
      border-bottom: none;
      display: flex;
      align-items: center;
      width: fit-content;
      max-width: 100%;
      overflow-x: auto;
      overscroll-behavior: none;
      scrollbar-width: none;
      position: relative;
      height: calc(var(--menu-height) + 1px);
      box-sizing: border-box;
      padding: 0 10px;
      scroll-snap-type: x mandatory;
    }
    .slide-menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      transition: left 0.5s ease-in-out;
    }
    .next-slide-button,
    .previous-slide-button {
      align-items: center;
      justify-content: center;
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      color: var(--affine-icon-color);
      transition:
        transform 0.3s ease-in-out,
        opacity 0.5s ease-in-out;
      z-index: 12;
    }
    .next-slide-button {
      opacity: 0;
      display: flex;
      top: 50%;
      right: 0;
      transform: translate(50%, -50%) scale(0.5);
    }
    .next-slide-button:hover {
      cursor: pointer;
      transform: translate(50%, -50%) scale(1);
    }
    .previous-slide-button {
      opacity: 0;
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    .previous-slide-button:hover {
      cursor: pointer;
      transform: translate(-50%, -50%) scale(1);
    }
    .previous-slide-button svg {
      transform: rotate(180deg);
    }
  `;

  @query('.menu-container')
  private accessor _menuContainer!: HTMLDivElement;

  @query('.slide-menu-content')
  private accessor _slideMenuContent!: HTMLDivElement;

  @consume({ context: edgelessToolbarSlotsContext })
  accessor toolbarSlots!: EdgelessToolbarSlots;

  @property({ attribute: false })
  accessor showPrevious = false;

  @property({ attribute: false })
  accessor showNext = false;

  @property({ attribute: false })
  accessor height = '40px';

  private _toggleSlideButton() {
    const scrollLeft = this._menuContainer.scrollLeft;
    const menuWidth = this._menuContainer.clientWidth;

    const leftMin = 0;
    const leftMax = this._slideMenuContent.clientWidth - menuWidth + 2; // border is 2
    this.showPrevious = scrollLeft > leftMin;
    this.showNext = scrollLeft < leftMax;
  }

  private _handleWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  private _handleSlideButtonClick(direction: 'left' | 'right') {
    const totalWidth = this._slideMenuContent.clientWidth;
    const currentScrollLeft = this._menuContainer.scrollLeft;
    const menuWidth = this._menuContainer.clientWidth;
    const newLeft =
      currentScrollLeft + (direction === 'left' ? -menuWidth : menuWidth);
    this._menuContainer.scrollTo({
      left: Math.max(0, Math.min(newLeft, totalWidth)),
      behavior: 'smooth',
    });
  }

  override firstUpdated() {
    setTimeout(this._toggleSlideButton.bind(this), 0);
    this._disposables.addFromEvent(this._menuContainer, 'scrollend', () => {
      this._toggleSlideButton();
    });
    this._disposables.add(
      this.toolbarSlots.resize.on(() => this._toggleSlideButton())
    );
  }

  override render() {
    return html`
      <div class="slide-menu-wrapper">
        <div
          class="previous-slide-button"
          @click=${() => this._handleSlideButtonClick('left')}
          style=${styleMap({ opacity: this.showPrevious ? '1' : '0' })}
        >
          ${ArrowRightSmallIcon}
        </div>
        <div
          class="menu-container"
          style=${styleMap({ '--menu-height': this.height })}
        >
          <div class="slide-menu-content" @wheel=${this._handleWheel}>
            <slot></slot>
          </div>
        </div>
        <div
          style=${styleMap({ opacity: this.showNext ? '1' : '0' })}
          class="next-slide-button"
          @click=${() => this._handleSlideButtonClick('right')}
        >
          ${ArrowRightSmallIcon}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-slide-menu': EdgelessSlideMenu;
  }
}
