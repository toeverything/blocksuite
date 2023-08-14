import { ArrowRightSmallIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

const DEFAULT_MENU_WIDTH = 455;
@customElement('edgeless-slide-menu')
export class EdgelessSlideMenu extends WithDisposable(LitElement) {
  static override styles = css`
    .menu-container {
      display: flex;
      padding: 4px;
      align-items: center;
      width: var(--menu-width);
      overflow: hidden;
      position: relative;
    }
    .next-slide-button,
    .previous-slide-button {
      align-items: center;
      justify-content: center;
      position: absolute;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      transition: transform 0.3s ease-in-out, opacity 0.5s ease-in-out;
      z-index: 12;
    }
    .next-slide-button {
      display: flex;
      opacity: 1;
      top: 50%;
      right: 0;
      transform: translate(50%, -50%) scale(0.75);
    }
    .next-slide-button:hover {
      cursor: pointer;
      transform: translate(50%, -50%) scale(1);
    }
    .previous-slide-button {
      opacity: 0;
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%) scale(0.75);
    }
    .previous-slide-button:hover {
      cursor: pointer;
      transform: translate(-50%, -50%) scale(1);
    }
    .previous-slide-button svg {
      transform: rotate(180deg);
    }
  `;
  @property({ attribute: false })
  menuWidth = DEFAULT_MENU_WIDTH;

  @query('.menu-container')
  private _menuContainer!: HTMLDivElement;

  @query('.next-slide-button')
  private _nextSlideButton!: HTMLDivElement;

  @query('.previous-slide-button')
  private _previousSlideButton!: HTMLDivElement;

  private _onNextSlideButtonClick = () => {
    // Scroll to the right
    const { scrollLeft, scrollWidth, clientWidth } = this._menuContainer;
    // Scroll distance is the minimum of the distance to the right end and the client width
    const scrollDistance = Math.min(
      scrollWidth - clientWidth - scrollLeft,
      clientWidth
    );

    this._menuContainer.scrollBy({
      left: scrollDistance,
      behavior: 'smooth',
    });
  };

  private _onPreviousSlideButtonClick = () => {
    // Scroll to the left
    const { scrollLeft, clientWidth } = this._menuContainer;
    // Scroll distance is the minimum of the distance to the left end and the client width
    const scrollDistance = Math.min(scrollLeft, clientWidth);
    this._menuContainer.scrollBy({
      left: -scrollDistance,
      behavior: 'smooth',
    });
  };

  override firstUpdated() {
    this._disposables.addFromEvent(this._menuContainer, 'scroll', () => {
      const { scrollLeft, scrollWidth, clientWidth } = this._menuContainer;
      if (scrollLeft === 0) {
        // if the scroll is at the beginning, hide the previous button
        this._previousSlideButton.style.opacity = '0';
      } else if (scrollLeft === scrollWidth - clientWidth) {
        // if the scroll is at the right end, hide the next button
        this._nextSlideButton.style.opacity = '0';
      } else {
        this._previousSlideButton.style.opacity = '1';
        this._nextSlideButton.style.opacity = '1';
      }
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  override render() {
    const menuContainerStyles = styleMap({
      '--menu-width': `${this.menuWidth}px`,
    });

    return html`
      <div>
        <div
          class="previous-slide-button"
          @click=${this._onPreviousSlideButtonClick}
        >
          ${ArrowRightSmallIcon}
        </div>
        <div class="menu-container" style=${menuContainerStyles}>
          <slot></slot>
        </div>
        <div class="next-slide-button" @click=${this._onNextSlideButtonClick}>
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
