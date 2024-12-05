import { ArrowDownIcon } from '@blocksuite/affine-components/icons';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { noop, SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { css, LitElement, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { CodeBlockComponent } from '../../../../code-block/code-block.js';

import {
  type FilterableListItem,
  type FilterableListOptions,
  showPopFilterableList,
} from '../../../../_common/components/filterable-list/index.js';

export class LanguageListButton extends WithDisposable(
  SignalWatcher(LitElement)
) {
  static override styles = css`
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

    .lang-button-icon {
      display: flex;
      align-items: center;
      color: ${unsafeCSSVarV2('icon/primary')};

      svg {
        height: 16px;
        width: 16px;
      }
    }
  `;

  private _abortController?: AbortController;

  private _clickLangBtn = () => {
    if (this.blockComponent.doc.readonly) return;
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

    const options: FilterableListOptions = {
      placeholder: 'Search for a language',
      onSelect: item => {
        const sortedBundledLanguages = this._sortedBundledLanguages;
        const index = sortedBundledLanguages.indexOf(item);
        if (index !== -1) {
          sortedBundledLanguages.splice(index, 1);
          sortedBundledLanguages.unshift(item);
        }
        this.blockComponent.doc.transact(() => {
          this.blockComponent.model.language$.value = item.name;
        });
      },
      active: item => item.name === this.blockComponent.model.language,
      items: this._sortedBundledLanguages,
    };

    showPopFilterableList({
      options,
      referenceElement: this._langButton,
      container: this.blockComponent.host,
      abortController: this._abortController,
      // stacking-context(editor-host)
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
    });
  };

  private _sortedBundledLanguages: FilterableListItem[] = [];

  override connectedCallback(): void {
    super.connectedCallback();

    const langList = localStorage.getItem('blocksuite:code-block:lang-list');
    if (langList) {
      this._sortedBundledLanguages = JSON.parse(langList);
    } else {
      this._sortedBundledLanguages = this.blockComponent.service.langs.map(
        lang => ({
          label: lang.name,
          name: lang.id,
          aliases: lang.aliases,
        })
      );
    }

    this.disposables.add(() => {
      localStorage.setItem(
        'blocksuite:code-block:lang-list',
        JSON.stringify(this._sortedBundledLanguages)
      );
    });
  }

  override render() {
    const textStyles = styleMap({
      fontFamily: 'Inter',
      fontSize: 'var(--affine-font-xs)',
      fontStyle: 'normal',
      fontWeight: '500',
      lineHeight: '20px',
      padding: '0 4px',
    });

    return html`<icon-button
      class="lang-button"
      data-testid="lang-button"
      width="auto"
      .text=${html`<div style=${textStyles}>
        ${this.blockComponent.languageName$.value}
      </div>`}
      height="24px"
      @click=${this._clickLangBtn}
      ?disabled=${this.blockComponent.doc.readonly}
    >
      <span class="lang-button-icon" slot="suffix">
        ${!this.blockComponent.doc.readonly ? ArrowDownIcon : nothing}
      </span>
    </icon-button> `;
  }

  @query('.lang-button')
  private accessor _langButton!: HTMLElement;

  @property({ attribute: false })
  accessor blockComponent!: CodeBlockComponent;

  @property({ attribute: false })
  accessor onActiveStatusChange: (active: boolean) => void = noop;
}
