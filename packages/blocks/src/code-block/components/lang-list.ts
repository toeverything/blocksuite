import type { Placement } from '@floating-ui/dom';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import {
  BUNDLED_LANGUAGES,
  type ILanguageRegistration,
  type Lang,
} from 'shiki';

import { scrollbarStyle } from '../../components/utils.js';
import { DoneIcon, SearchIcon } from '../../icons/index.js';
import { getLanguagePriority } from '../utils/code-languages.js';
import { PLAIN_TEXT_REGISTRATION } from '../utils/consts.js';

// TODO extract to a common list component
@customElement('lang-list')
export class LangList extends LitElement {
  static override get styles() {
    return css`
      :host {
        max-height: 100%;
        width: 230px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: var(--affine-background-overlay-panel-color);
        color: var(--affine-text-primary-color);
        border-radius: 12px;
        z-index: var(--affine-z-index-popover);
        pointer-events: auto;
      }

      .lang-list-container {
        box-sizing: border-box;
        display: flex;
        height: 100%;
        overflow: hidden;
        flex-direction: column;
        box-shadow: var(--affine-menu-shadow);
        border-radius: 8px;
        padding: 8px;
      }

      .lang-list-button-container {
        flex: 1;
        overflow-y: scroll;
        padding-top: 5px;
        padding-left: 4px;
        padding-right: 4px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      ${scrollbarStyle('.lang-list-button-container')}

      .lang-item {
        display: flex;
        justify-content: space-between;
        padding: 12px;
      }
      .lang-item svg {
        width: 20px;
        height: 20px;
      }
      .lang-item-active {
        color: var(--affine-blue-600);
        background: var(--affine-hover-color-filled);
      }

      .divider {
        height: 1px;
        background-color: var(--affine-divider-color);
        margin: 8px 0;
        flex-shrink: 0;
      }

      .input-wrapper {
        display: flex;
        margin-left: 4px;
        border-radius: 4px;
        padding: 4px 10px;
        gap: 4px;
        border: 1px solid transparent;
      }

      .input-wrapper:focus-within {
        border: 1px solid var(--affine-blue-600);
        box-shadow: var(--affine-active-shadow);
      }

      #filter-input {
        flex: 1;
        align-items: center;
        height: 20px;
        width: 140px;
        border-radius: 8px;
        padding-top: 2px;
        border: none;
        font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
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
        display: flex;
        align-items: center;
        color: var(--affine-icon-color);
      }
    `;
  }

  @property({ attribute: false })
  currentLanguageId!: Lang;

  @property({ attribute: false })
  onClose?: () => void;

  @property({ attribute: false })
  onSelectLanguage?: (lang: ILanguageRegistration | null) => void;

  @property({ attribute: false })
  placement?: Placement;

  @state()
  private _filterText = '';

  @state()
  private _currentSelectedIndex = 0;

  @query('#filter-input')
  filterInput!: HTMLInputElement;

  override async connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      this.filterInput?.focus();
    }, 0);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.onClose?.();
  }

  private _onLanguageClicked(language: ILanguageRegistration | null) {
    this.onSelectLanguage?.(language);
  }

  override render() {
    const isFlip = this.placement?.startsWith('top');

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
      <div
        class="lang-list-container"
        style="${isFlip ? 'flex-direction: column-reverse;' : ''}"
      >
        <div class="input-wrapper">
          <div class="search-icon">${SearchIcon}</div>
          <input
            id="filter-input"
            type="text"
            placeholder="Search for a language"
            @input="${() => {
              this._filterText = this.filterInput?.value;
              this._currentSelectedIndex = 0;
            }}"
            @keydown="${onLanguageSelect}"
          />
        </div>
        <div class="divider"></div>
        <div class="lang-list-button-container">
          ${filteredLanguages.map((language, index) => {
            const isActive = index === this._currentSelectedIndex;
            return html`
              <icon-button
                width="100%"
                height="32px"
                @click="${() => this._onLanguageClicked(language)}"
                class=${[
                  'lang-item',
                  isActive ? 'lang-item-active' : null,
                ].join(' ')}
              >
                ${language.displayName ?? language.id}
                <slot name="suffix"
                  >${this.currentLanguageId === language.id
                    ? DoneIcon
                    : nothing}</slot
                >
              </icon-button>
            `;
          })}
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
