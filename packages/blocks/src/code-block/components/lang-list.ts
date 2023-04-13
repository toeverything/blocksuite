import { SearchIcon } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { createEvent, ShadowlessElement } from '../../__internal__/index.js';
import { codeLanguages } from '../utils/code-languages.js';

// TODO extract to a common list component
@customElement('lang-list')
export class LangList extends ShadowlessElement {
  static get styles() {
    return css`
      lang-list {
        display: flex;
        flex-direction: column;
        position: absolute;
        background: var(--affine-background-primary-color);
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

      .input-wrapper {
        position: relative;
        display: flex;
        margin-top: 8px;
        margin-left: 4px;
      }

      #filter-input {
        display: flex;
        align-items: center;
        height: 32px;
        width: 192px;
        border: 1px solid var(--affine-border-color);
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
        color: var(--affine-placeholder-color);
        font-size: var(--affine-font-sm);
      }

      .search-icon {
        position: absolute;
        left: 8px;
        height: 100%;
        display: flex;
        align-items: center;
        fill: var(--affine-icon-color);
      }
    `;
  }

  @state()
  private _filterText = '';

  @state()
  private _currentSelectedIndex = -1;

  @property()
  selectedLanguage = '';

  @query('#filter-input')
  filterInput!: HTMLInputElement;

  @property()
  delay = 150;

  static languages = codeLanguages
    .map(lang => lang.toUpperCase()[0] + lang.slice(1))
    .concat(['Plain Text']);

  override async connectedCallback() {
    await super.connectedCallback();
    // Avoid triggering click away listener on initial render
    document.addEventListener('click', this._clickAwayListener);
    this.filterInput.focus();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickAwayListener);
  }

  private _clickAwayListener = (e: Event) => {
    if (this.renderRoot.parentElement?.contains(e.target as Node)) {
      return;
    }
    this.dispatchEvent(createEvent('dispose', null));
  };

  private _onLanguageClicked(language: string) {
    this.selectedLanguage = language;
    this.dispatchEvent(
      createEvent('selected-language-changed', {
        language: this.selectedLanguage ?? 'Plain Text',
      })
    );
  }

  render() {
    const filteredLanguages = LangList.languages.filter(language => {
      if (!this._filterText) {
        return true;
      }
      return language.toLowerCase().startsWith(this._filterText.toLowerCase());
    });

    const onLanguageSelect = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this._currentSelectedIndex >= filteredLanguages.length - 1) return;

        this._currentSelectedIndex++;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this._currentSelectedIndex <= -1) return;

        this._currentSelectedIndex--;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (
          this._currentSelectedIndex === -1 ||
          this._currentSelectedIndex >= filteredLanguages.length
        )
          return;

        this._onLanguageClicked(filteredLanguages[this._currentSelectedIndex]);
      }
    };

    return html`
      <div class="lang-list-container">
        <div class="input-wrapper">
          <div class="search-icon">${SearchIcon}</div>
          <input
            id="filter-input"
            type="text"
            placeholder="Search"
            @input="${() => {
              this._filterText = this.filterInput?.value;
              this._currentSelectedIndex = -1;
            }}"
            @keydown="${onLanguageSelect}"
          />
        </div>
        <div class="lang-list-button-container">
          ${filteredLanguages.map(
            (language, index) => html`
              <icon-button
                width="100%"
                height="32px"
                @click="${() => this._onLanguageClicked(language)}"
                class="lang-item"
                ?hover=${index === this._currentSelectedIndex}
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
