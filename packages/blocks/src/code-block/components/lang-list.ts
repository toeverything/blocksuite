import { SearchIcon } from '@blocksuite/global/config';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  BUNDLED_LANGUAGES,
  type ILanguageRegistration,
  type Lang,
} from 'shiki';

import { createEvent, ShadowlessElement } from '../../__internal__/index.js';
import { POPULAR_LANGUAGES_MAP } from '../utils/code-languages.js';
import { PLAIN_TEXT_REGISTRATION } from '../utils/consts.js';

// TODO extract to a common list component
@customElement('lang-list')
export class LangList extends ShadowlessElement {
  static override get styles() {
    return css`
      lang-list {
        display: flex;
        flex-direction: column;
        position: absolute;
        background: var(--affine-background-overlay-panel-color);
        border-radius: 12px;
        top: 24px;
        z-index: 1;
      }

      .lang-list-container {
        box-shadow: var(--affine-menu-shadow);
        border-radius: 8px;
        padding: 12px 8px;
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
        border-radius: 8px;
        padding-left: 44px;
        padding-top: 4px;

        font-family: var(--affine-font-family);
        font-size: var(--affine-font-sm);
        box-sizing: border-box;
        color: inherit;
        background: var(--affine-background-overlay-panel-color);
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
  private _currentSelectedIndex = 0;

  @query('#filter-input')
  filterInput!: HTMLInputElement;

  @property()
  delay = 150;

  override async connectedCallback() {
    super.connectedCallback();
    // Avoid triggering click away listener on initial render
    document.addEventListener('click', this._clickAwayListener);

    setTimeout(() => {
      this.filterInput?.focus();
    }, 0);
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

  private _onLanguageClicked(language: ILanguageRegistration | null) {
    // TODO use slot instead
    this.dispatchEvent(
      createEvent('selected-language-changed', {
        language: language?.id ?? null,
      })
    );
  }

  override render() {
    const filteredLanguages = [PLAIN_TEXT_REGISTRATION, ...BUNDLED_LANGUAGES]
      .filter(language => {
        if (!this._filterText) {
          return true;
        }
        return (
          language.id.startsWith(this._filterText.toLowerCase()) ||
          language.aliases?.some(alias =>
            alias.startsWith(this._filterText.toLowerCase())
          )
        );
      })
      .sort(
        (a, b) =>
          (POPULAR_LANGUAGES_MAP[a.id as Lang] ?? Infinity) -
          (POPULAR_LANGUAGES_MAP[b.id as Lang] ?? Infinity)
      );

    const onLanguageSelect = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._currentSelectedIndex =
          (this._currentSelectedIndex + 1) % filteredLanguages.length;
        // TODO scroll to item
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._currentSelectedIndex =
          (this._currentSelectedIndex + filteredLanguages.length - 1) %
          filteredLanguages.length;
        // TODO scroll to item
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
              this._currentSelectedIndex = 0;
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
                ${language.id[0].toUpperCase() + language.id.slice(1)}
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
    /**
     * @deprecated Use slot instead
     */
    'selected-language-changed': CustomEvent<{ language: string | null }>;
    dispose: CustomEvent<null>;
  }
}
