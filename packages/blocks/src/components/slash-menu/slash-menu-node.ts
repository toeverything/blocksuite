import { getRichTextByModel } from '@blocksuite/blocks/std.js';
import type { RichText } from '@blocksuite/blocks/__internal__/rich-text/rich-text.js';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
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
    .overlay-mask {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: var(--affine-z-index-popover);
    }
    ${slashMenuStyle}
  `;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  model!: BaseBlockModel;

  @property()
  abortController = new AbortController();

  @property()
  searchString = '';

  @state()
  activeItemIndex = 0;

  @query('.slash-menu')
  slashMenuElement!: HTMLElement;

  // Just a temp variable
  richText?: RichText;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._escapeListener);

    const richText = getRichTextByModel(this.model);
    if (!richText) {
      console.warn(
        'Slash Menu may not work properly! No rich text found for model',
        this.model
      );
      return;
    }
    richText.addEventListener('keydown', this._keyDownListener, {
      // Workaround Use capture to prevent the event from triggering the keyboard bindings action
      capture: true,
    });
    this.richText = richText;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._escapeListener);
    this.richText?.removeEventListener('keydown', this._keyDownListener, {
      capture: true,
    });
  }

  protected override willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('searchString')) {
      this.activeItemIndex = 0;
    }
  }

  /**
   * Handle arrow key
   */
  private _keyDownListener = (e: KeyboardEvent) => {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(
        e.key
      )
    ) {
      return;
    }
    if (e.key === 'ArrowLeft') {
      this.abortController.abort('ABORT');
      return;
    }
    const configLen = this._filterConfig().length;
    switch (e.key) {
      case 'Enter': {
        this._handleItemClick(this.activeItemIndex);
        break;
      }
      case 'ArrowUp': {
        this.activeItemIndex =
          (this.activeItemIndex - 1 + configLen) % configLen;
        break;
      }
      case 'ArrowDown': {
        this.activeItemIndex = (this.activeItemIndex + 1) % configLen;
        break;
      }
      case 'ArrowRight':
      case 'ArrowLeft':
        // do nothing temporarily
        return;
      default:
        throw new Error(`Unknown key: ${e.key}`);
    }
    // prevent arrow key from moving cursor
    e.preventDefault();
    // prevent the event from triggering the keyboard bindings action
    e.stopPropagation();
  };

  /**
   * Handle press esc
   */
  private _escapeListener = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') {
      return;
    }
    this.abortController.abort('ABORT');
    window.removeEventListener('keyup', this._escapeListener);
  };

  private _handleItemClick(index: number) {
    this.abortController.abort();
    const { flavour, type } = this._filterConfig()[index];
    updateSelectedTextType(flavour, type, this.model.page);
  }

  private _filterConfig() {
    const normalizeString = this.searchString.trim().toLowerCase();

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

    const filterConfig = this._filterConfig();
    if (!filterConfig.length) {
      this.abortController.abort('ABORT');
      return html``;
    }

    return html`<div class="slash-menu-container" style="${containerStyles}">
      <div
        class="overlay-mask"
        @click="${() => this.abortController.abort()}"
      ></div>
      <div class="slash-menu" style="${slashMenuStyles}">
        ${filterConfig.map(
          ({ flavour, type, name, icon }, index) => html`<format-bar-button
            width="100%"
            style="padding-left: 12px; justify-content: flex-start;"
            ?hover=${this.activeItemIndex === index}
            text="${name}"
            data-testid="${type}"
            @click=${() => {
              this._handleItemClick(index);
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
