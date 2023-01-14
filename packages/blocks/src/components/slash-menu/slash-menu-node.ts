import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { paragraphConfig } from '../../page-block/utils/const.js';
import { updateSelectedTextType } from '../../page-block/utils/index.js';

const slashMenuStyle = css`
  .slash-menu {
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    position: absolute;
    width: 173px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 8px 4px;

    background: var(--affine-popover-background);
    box-shadow: var(--affine-popover-shadow);
    border-radius: 0px 10px 10px 10px;
    z-index: var(--affine-z-index-popover);
  }
`;

@customElement('slash-menu')
export class SlashMenu extends LitElement {
  static styles = css`
    .slash-menu-container {
      box-sizing: border-box;
      position: fixed;
      display: flex;
      align-items: center;

      border-radius: 10px 10px 10px 0;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      z-index: var(--affine-z-index-popover);
    }
    ${slashMenuStyle}
  `;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  page: Page | null = null;

  @property()
  abortController = new AbortController();

  @property()
  searchString = '';

  @query('.slash-menu')
  slashMenuElement!: HTMLElement;

  override connectedCallback(): void {
    super.connectedCallback();

    // Handle click outside
    const clickAwayListener = (e: MouseEvent) => {
      if (e.target === this) {
        return;
      }
      this.abortController.abort('ABORT');
      window.removeEventListener('mousedown', clickAwayListener);
    };
    window.addEventListener('mousedown', clickAwayListener);
  }

  filterConfig() {
    const normalizeString = this.searchString.slice(1).trim().toLowerCase();

    if (!normalizeString) {
      return paragraphConfig;
    }
    return paragraphConfig.filter(({ name, type }) => {
      if (name.toLowerCase().includes(normalizeString)) {
        return true;
      }
      if (type.toLowerCase().includes(normalizeString)) {
        return true;
      }
      return false;
    });
  }

  override render() {
    const containerStyles = styleMap({
      left: this.left,
      top: this.top,
    });

    const position = 'bottom';
    const slashMenuStyles = styleMap({
      left: '0',
      top: position === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: position !== 'bottom' ? 'calc(100% + 4px)' : null,
      display: 'flex',
      flexDirection: position === 'bottom' ? 'column' : 'column-reverse',
    });

    const filterConfig = this.filterConfig();
    if (!filterConfig.length) {
      this.abortController.abort('ABORT');
      return html``;
    }

    return html`<div class="slash-menu-container" style="${containerStyles}">
      <div class="slash-menu" style="${slashMenuStyles}">
        ${filterConfig.map(
          ({ flavour, type, name, icon }) => html`<format-bar-button
            width="100%"
            style="padding-left: 12px; justify-content: flex-start;"
            text="${name}"
            data-testid="${type}"
            @click=${() => {
              if (!this.page) {
                throw new Error('Failed to format paragraph! Page not found.');
              }
              this.abortController.abort();
              updateSelectedTextType(flavour, type, this.page);
            }}
          >
            ${icon}
          </format-bar-button>`
        )}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slash-menu': SlashMenu;
  }
}
