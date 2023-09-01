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
      overflow-x: clip;
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
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
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

  @property({ attribute: false })
  showNext = true;

  @query('.next-slide-button')
  private _nextSlideButton!: HTMLDivElement;

  @query('.previous-slide-button')
  private _previousSlideButton!: HTMLDivElement;

  @query('.slide-menu-content')
  private _slideMenuContent!: HTMLDivElement;

  private _onNextSlideButtonClick = () => {
    // Scroll to the right
    const { clientWidth } = this._slideMenuContent;
    const left = Math.abs(
      parseInt(getComputedStyle(this._slideMenuContent).left)
    );
    // If the slide menu content is not at the right end
    // move the slide menu content to the right
    if (left < clientWidth - this.menuWidth) {
      // move the slide menu content to the right
      const scrollDistance = Math.min(
        clientWidth - this.menuWidth - left,
        this.menuWidth
      );
      this._slideMenuContent.style.left = `${-(left + scrollDistance)}px`;
    }
  };

  private _onPreviousSlideButtonClick = () => {
    // Scroll to the left
    const left = Math.abs(
      parseInt(getComputedStyle(this._slideMenuContent).left)
    );
    if (left > 0) {
      // move the slide menu content to the left
      const scrollDistance = Math.min(left, this.menuWidth);
      this._slideMenuContent.style.left = `${-left + scrollDistance}px`;
    }
  };

  override firstUpdated() {
    // Add a event listener to the slide menu content
    // When the content position is changed, hide the corresponding button
    this._disposables.addFromEvent(
      this._slideMenuContent,
      'transitionend',
      () => {
        this._previousSlideButton.style.opacity = '1';
        this._nextSlideButton.style.opacity = '1';
        const left = Math.abs(
          parseInt(getComputedStyle(this._slideMenuContent).left)
        );
        if (left === 0) {
          this._previousSlideButton.style.opacity = '0';
        } else if (
          left ===
          this._slideMenuContent.clientWidth - this.menuWidth
        ) {
          this._nextSlideButton.style.opacity = '0';
        }
      }
    );
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
          <div class="slide-menu-content">
            <slot></slot>
          </div>
        </div>
        <div
          style=${styleMap({ display: this.showNext ? 'normal' : 'none' })}
          class="next-slide-button"
          @click=${this._onNextSlideButtonClick}
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
