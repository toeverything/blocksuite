import { BaseBlockModel, Page, Signal } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { paragraphConfig } from '../../page-block/utils/const.js';
import { updateSelectedTextType } from '../../page-block/utils/index.js';

const paragraphPanelStyle = css`
  .paragraph-button > svg:nth-child(2) {
    transition-duration: 0.3s;
  }
  .paragraph-button:is(:hover, :focus-visible, :active) > svg:nth-child(2) {
    transform: rotate(180deg);
  }

  .paragraph-panel {
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
    .slash-menu {
      box-sizing: border-box;
      position: fixed;
      display: flex;
      align-items: center;

      border-radius: 10px 10px 10px 0;
      background: var(--affine-popover-background);
      box-shadow: var(--affine-popover-shadow);
      z-index: var(--affine-z-index-popover);
    }
    ${paragraphPanelStyle}
  `;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  bottom: string | null = null;

  @property()
  page: Page | null = null;

  @property()
  abortController = new AbortController();

  // Sometimes the quick bar need to update position
  @property()
  positionUpdated = new Signal();

  @state()
  models: BaseBlockModel[] = [];

  @query('.slash-menu')
  slashMenuElement!: HTMLElement;

  override connectedCallback(): void {
    super.connectedCallback();

    this.addEventListener('mousedown', (e: MouseEvent) => {
      // Prevent click event from making selection lost
      e.preventDefault();
    });
  }

  private _paragraphPanelTemplate() {
    const showParagraphPanel = 'bottom';
    const styles = styleMap({
      left: '0',
      top: showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: showParagraphPanel !== 'bottom' ? 'calc(100% + 4px)' : null,
      display: 'flex',
      flexDirection:
        showParagraphPanel === 'bottom' ? 'column' : 'column-reverse',
    });
    return html`<div class="paragraph-panel" style="${styles}">
      ${paragraphConfig.map(
        ({ flavour, type, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          data-testid="${type}"
          @click=${() => {
            if (!this.page) {
              throw new Error('Failed to format paragraph! Page not found.');
            }

            updateSelectedTextType(flavour, type, this.page);
            this.remove();
          }}
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const paragraphPanel = this._paragraphPanelTemplate();

    const styles = styleMap({
      left: this.left,
      top: this.top,
      bottom: this.bottom,
    });
    return html`<div class="slash-menu" style="${styles}">
      ${paragraphPanel}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slash-menu': SlashMenu;
  }
}
