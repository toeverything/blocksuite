import { BLOCK_ID_ATTR, SearchIcon } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { createEvent, NonShadowLitElement } from '../../__internal__/index.js';
import { codeLaguages } from '../utils/code-laguages.js';

// TODO extract to a common list component
@customElement('lang-list')
export class LangList extends NonShadowLitElement {
  static get styles() {
    return css`
      lang-list {
        display: flex;
        flex-direction: column;
        position: absolute;
        background: var(--affine-popover-background);
        border-radius: 10px;
        top: 24px;
        z-index: 1;
      }

      .lang-list-container {
        box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
          -4px -4px 13px rgba(58, 76, 92, 0.02),
          6px 6px 36px rgba(58, 76, 92, 0.06);
        border-radius: 0 10px 10px 10px;
      }

      .lang-list-button-container {
        position: relative;
        overflow: scroll;
        height: 424px;
        width: 200px;
        padding-top: 5px;
        padding-left: 4px;
        padding-right: 4px;
        /*scrollbar-color: #fff0 #fff0;*/
      }

      /*
      .lang-list-button-container::-webkit-scrollbar {
        background: none;
      }
      */

      .lang-item {
        display: flex;
        justify-content: flex-start;
        padding-left: 12px;
        margin-bottom: 5px;
      }

      code-block-button {
        font-size: var(--affine-font-sm);
        text-align: justify;
        line-height: 22px;
      }

      code-block-button:hover {
        color: var(--affine-primary-color);
        background: var(--affine-hover-background);
      }

      #filter-input {
        display: flex;
        align-items: center;
        height: 32px;
        width: 192px;
        border: 1px solid #d0d7e3;
        border-radius: 10px;
        padding-left: 44px;
        padding-top: 4px;

        font-family: var(--affine-font-family);
        font-size: var(--affine-font-sm);
        box-sizing: border-box;
        color: inherit;
        background: transparent;
      }

      #filter-input:focus {
        outline: none;
      }

      #filter-input::placeholder {
        color: #888a9e;
        font-size: var(--affine-font-sm);
      }

      .search-icon {
        left: 13.65px;
        position: absolute;
        top: 16px;
      }
    `;
  }

  @state()
  filterText = '';

  @property()
  id!: string;

  @property()
  selectedLanguage = '';

  @property()
  showLangList = 'hidden';

  @query('#filter-input')
  filterInput!: HTMLInputElement;

  @state()
  disposeTimer = 0;

  @property()
  delay = 150;

  static languages = codeLaguages;

  protected updated() {
    if (this.showLangList !== 'hidden') {
      this.filterInput.focus();
    }
  }

  protected firstUpdated() {
    document.addEventListener('click', (e: MouseEvent) => {
      this._clickHandler(e);
    });
  }

  private _clickHandler(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      !target.closest('.container')?.closest(`[${BLOCK_ID_ATTR}="${this.id}"]`)
    ) {
      this._dispose();
    }
  }

  private _dispose() {
    this.dispatchEvent(createEvent('dispose', null));
    document.removeEventListener('click', this._clickHandler);
    this.filterText = '';
  }

  private _onLanguageClicked(language: string) {
    this.selectedLanguage = language;
    this.dispatchEvent(
      createEvent('selected-language-changed', {
        language: this.selectedLanguage ?? 'JavaScript',
      })
    );
    this._dispose();
  }

  render() {
    const filteredLanguages = LangList.languages.filter(language => {
      if (!this.filterText) {
        return true;
      }
      return language.toLowerCase().startsWith(this.filterText.toLowerCase());
    });

    if (this.showLangList === 'hidden') {
      return html``;
    }

    const styles = styleMap({
      display: 'flex',
      'padding-top': '8px',
      'padding-left': '4px',
    });

    return html`
      <div class="lang-list-container">
        <div style="${styles}">
          <div class="search-icon">${SearchIcon}</div>
          <input
            id="filter-input"
            type="text"
            placeholder="Search"
            value=${this.filterText}
            @keyup=${() => (this.filterText = this.filterInput?.value)}
          />
        </div>
        <div class="lang-list-button-container">
          ${filteredLanguages.map(
            language => html`
              <icon-button
                width="100%"
                height="32px"
                @click="${() => this._onLanguageClicked(language)}"
                class="lang-item"
              >
                ${language}
              </icon-button>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lang-list': LangList;
  }

  interface HTMLElementEventMap {
    'selected-language-changed': CustomEvent<{ language: string }>;
    dispose: CustomEvent<null>;
  }
}
