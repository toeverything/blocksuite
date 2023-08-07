import { SearchIcon } from '@blocksuite/global/config';
import { ShadowlessElement } from '@blocksuite/lit';
import { Slot } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  BUNDLED_LANGUAGES,
  type ILanguageRegistration,
  type Lang,
} from 'shiki';

import { scrollbarStyle } from '../../components/utils.js';
import { getLanguagePriority } from '../utils/code-languages.js';
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
        z-index: var(--affine-z-index-popover);
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
      }

      ${scrollbarStyle}

      .lang-item {
        display: flex;
        justify-content: flex-start;
        padding-left: 12px;
        margin-bottom: 5px;
      }

      .input-wrapper {
        display: flex;
        margin-top: 8px;
        margin-left: 4px;
        border: 1px solid var(--affine-border-color);
        border-radius: 8px;
        padding: 4px 10px;
      }

      #filter-input {
        flex: 1;
        align-items: center;
        height: 20px;
        width: 140px;
        border-radius: 8px;
        padding-top: 2px;
        border: none;
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
        height: 100%;
        display: flex;
        padding-right: 4px;
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

  @property({ attribute: false })
  currentLanguageId!: Lang;

  @property({ attribute: false })
  delay = 150;

  slots = {
    selectedLanguageChanged: new Slot<{ language: string | null }>(),
    dispose: new Slot(),
  };
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
    this.slots.dispose.emit();
  };

  private _onLanguageClicked(language: ILanguageRegistration | null) {
    this.slots.selectedLanguageChanged.emit({ language: language?.id ?? null });
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
          getLanguagePriority(a.id as Lang, this.currentLanguageId === a.id) -
          getLanguagePriority(b.id as Lang, this.currentLanguageId === b.id)
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
                ${language.displayName ?? language.id}
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
}
