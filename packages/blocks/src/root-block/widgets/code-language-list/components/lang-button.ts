import { ArrowDownIcon } from '@blocksuite/affine-components/icons';
import { noop } from '@blocksuite/global/utils';
import { SignalWatcher } from '@lit-labs/preact-signals';
import { LitElement, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';
import { bundledLanguagesInfo } from 'shiki';

import type { CodeBlockComponent } from '../../../../code-block/code-block.js';

import {
  type FilterableListItem,
  type FilterableListOptions,
  showPopFilterableList,
} from '../../../../_common/components/filterable-list/index.js';

const sortedBundledLanguages: FilterableListItem[] = bundledLanguagesInfo.map(
  lang => ({
    label: lang.name,
    name: lang.id,
    aliases: lang.aliases,
  })
);

@customElement('language-list-button')
export class LanguageListButton extends SignalWatcher(LitElement) {
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
      items: sortedBundledLanguages,
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

  override render() {
    return html`<icon-button
      class="lang-button"
      data-testid="lang-button"
      width="auto"
      text=${this.blockComponent.languageName$.value}
      height="24px"
      @click=${this._clickLangBtn}
      ?disabled=${this.blockComponent.doc.readonly}
    >
      <span slot="suffix">
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

declare global {
  interface HTMLElementTagNameMap {
    'language-list-button': LanguageListButton;
  }
}
