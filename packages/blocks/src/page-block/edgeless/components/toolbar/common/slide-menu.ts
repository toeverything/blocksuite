import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

const DEFAULT_MENU_WIDTH = 468;
const MENU_HEIGHT = 40;
import { ArrowRightSmallIcon } from '../../../../../icons/index.js';

@customElement('edgeless-slide-menu')
export class EdgelessSlideMenu extends WithDisposable(LitElement) {
  static override styles = css`
    ::-webkit-scrollbar {
      display: none;
    }
    .menu-container {
      --menu-width: ${DEFAULT_MENU_WIDTH}px;
      --menu-height: ${MENU_HEIGHT}px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px 8px 0 0;
      border: 1px solid var(--affine-border-color);
      display: flex;
      align-items: center;
      width: var(--menu-width);
      overflow-x: auto;
      position: relative;
      height: calc(var(--menu-height) + 1px);
      box-sizing: border-box;
      padding: 0 18px;
    }
    .slide-menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: 0;
      top: 0;
      height: var(--menu-height);
      transition: left 0.5s ease-in-out;
      padding: 0 16px;
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
      display: flex;
      opacity: 1;
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
  @property({ attribute: false })
  menuWidth = DEFAULT_MENU_WIDTH;

  @property({ attribute: false })
  showNext = true;

  @query('.menu-container')
  private _menuContainer!: HTMLDivElement;

  @query('.next-slide-button')
  private _nextSlideButton!: HTMLDivElement;

  @query('.previous-slide-button')
  private _previousSlideButton!: HTMLDivElement;

  @query('.slide-menu-content')
  private _slideMenuContent!: HTMLDivElement;

  override firstUpdated() {
    // Add a event listener to the slide menu content
    // When the content position is changed, hide the corresponding button
    this._disposables.addFromEvent(this._menuContainer, 'scrollend', () => {
      this._previousSlideButton.style.opacity = '1';
      this._nextSlideButton.style.opacity = '1';

      const left = this._menuContainer.scrollLeft;
      const leftMin = 0;
      const leftMax = this._slideMenuContent.clientWidth - this.menuWidth + 2; // border is 2
      if (left === leftMin) {
        this._previousSlideButton.style.opacity = '0';
      } else if (left === leftMax) {
        this._nextSlideButton.style.opacity = '0';
      }
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  private _handleWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  private _handleSlideButtonClick(direction: 'left' | 'right') {
    const left = direction === 'left' ? 0 : this._slideMenuContent.clientWidth;
    this._menuContainer.scrollTo({
      left: left,
      behavior: 'smooth',
    });
  }

  override render() {
    const menuContainerStyles = styleMap({
      '--menu-width': `${this.menuWidth}px`,
    });

    return html`
      <div>
        <div
          class="previous-slide-button"
          @click=${() => this._handleSlideButtonClick('left')}
        >
          ${ArrowRightSmallIcon}
        </div>
        <div class="menu-container" style=${menuContainerStyles}>
          <div class="slide-menu-content" @wheel="${this._handleWheel}">
            <slot></slot>
          </div>
        </div>
        <div
          style=${styleMap({ display: this.showNext ? 'normal' : 'none' })}
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
