import { noop } from '@blocksuite/global/utils';
import { css, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import { type BundledLanguage, bundledLanguagesInfo } from 'shiki';

import {
  type FilterableListOptions,
  showPopFilterableList,
} from '../../../../_common/components/filterable-list/index.js';
import { ArrowDownIcon } from '../../../../_common/icons/text.js';
import type { CodeBlockComponent } from '../../../../code-block/code-block.js';
import {
  getLanguagePriority,
  getStandardLanguage,
} from '../../../../code-block/utils/code-languages.js';
import {
  PLAIN_TEXT_LANG_INFO,
  type StrictLanguageInfo,
} from '../../../../code-block/utils/consts.js';

@customElement('language-list-button')
export class LanguageListButton extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .lang-button {
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-1);
      display: flex;
      gap: 4px;
      padding: 2px 4px;
    }

    .lang-button:hover {
      background: var(--affine-hover-color-filled);
    }

    .lang-button[hover] {
      background: var(--affine-hover-color-filled);
    }
  `;

  @state()
  private accessor _currentLanguage: StrictLanguageInfo = PLAIN_TEXT_LANG_INFO;

  @query('.lang-button')
  private accessor _langButton!: HTMLElement;

  private _abortController?: AbortController;

  @property({ attribute: false })
  accessor blockElement!: CodeBlockComponent;

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;

  private _updateLanguage() {
    this._currentLanguage =
      getStandardLanguage(this.blockElement.model.language) ??
      PLAIN_TEXT_LANG_INFO;
  }

  private _clickLangBtn = () => {
    if (this.blockElement.doc.readonly) return;
    if (this._abortController) {
      // Close the language list if it's already opened.
      this._abortController.abort();
      return;
    }
    this._abortController = new AbortController();
    this._abortController.signal.addEventListener('abort', () => {
      this.onActiveStatusChange(false);
      this._abortController = undefined;
    });
    this.onActiveStatusChange(true);

    const languages = (
      [...bundledLanguagesInfo, PLAIN_TEXT_LANG_INFO] as StrictLanguageInfo[]
    ).map(lang => ({
      label: lang.name,
      name: lang.id,
      aliases: lang.aliases,
    }));

    const options: FilterableListOptions = {
      placeholder: 'Search for a language',
      onSelect: item => {
        this.blockElement.setLang(item.name);
        this._updateLanguage();
      },
      active: item => item.name === this._currentLanguage.id,
      items: languages,
    };

    showPopFilterableList({
      options,
      filter: (a, b) =>
        getLanguagePriority(a.name as BundledLanguage) -
        getLanguagePriority(b.name as BundledLanguage),
      referenceElement: this._langButton,
      container: this.blockElement.host,
      abortController: this._abortController,
      // stacking-context(editor-host)
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
    });
  };

  override connectedCallback() {
    super.connectedCallback();
    this._updateLanguage();
  }

  override render() {
    return html`<icon-button
      class="lang-button"
      data-testid="lang-button"
      width="auto"
      text=${this._currentLanguage.name ?? this._currentLanguage.id}
      height="24px"
      @click=${this._clickLangBtn}
      ?disabled=${this.blockElement.doc.readonly}
    >
      <span slot="suffix">
        ${!this.blockElement.doc.readonly ? ArrowDownIcon : nothing}
      </span>
    </icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'language-list-button': LanguageListButton;
  }
}
