import { WidgetElement } from '@blocksuite/block-std';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { type BundledLanguage, bundledLanguagesInfo } from 'shiki';

import {
  FilterableListComponent,
  popFilterableList,
} from '../../../_common/components/filterable-list/index.js';
import { ArrowDownIcon } from '../../../_common/icons/text.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import type { CodeBlockComponent } from '../../../code-block/index.js';
import {
  getLanguagePriority,
  getStandardLanguage,
} from '../../../code-block/utils/code-languages.js';
import {
  PLAIN_TEXT_LANG_INFO,
  type StrictLanguageInfo,
} from '../../../code-block/utils/consts.js';

export const AFFINE_CODE_LANGUAGE_LIST_WIDGET =
  'affine-code-language-list-widget';

@customElement(AFFINE_CODE_LANGUAGE_LIST_WIDGET)
export class AffineCodeLanguageListWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  static override styles = css`
    :host {
      position: absolute;
      top: 5px;
      left: 5px;
    }
    .lang-button {
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-1);
      gap: 4px;
      padding: 2px 4px;
    }

    .lang-button:hover {
      background: var(--affine-hover-color-filled);
    }

    .lang-button[hover] {
      background: var(--affine-hover-color-filled);
    }

    .lang-button[data-visible='false'] {
      visibility: hidden;
    }
  `;

  @query('.lang-button')
  private accessor _langButton!: HTMLElement;

  @state()
  private accessor _visible = false;

  @state()
  private accessor _curLanguage: StrictLanguageInfo = PLAIN_TEXT_LANG_INFO;

  @state()
  private accessor _listAbortController: AbortController | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._visible = this.matches(':hover');

    this.disposables.addFromEvent(this.blockElement, 'mouseover', () => {
      if (this._visible) return;
      this._visible = true;
    });

    this.disposables.addFromEvent(this.blockElement, 'mouseleave', () => {
      this._visible = false;
    });

    this._updateLanguage();
  }

  private _updateLanguage() {
    this._curLanguage =
      getStandardLanguage(this.model.language) ?? PLAIN_TEXT_LANG_INFO;
  }

  private _popList() {
    if (this.doc.readonly || this._listAbortController) return;
    const abortController = new AbortController();

    abortController.signal.addEventListener('abort', () => {
      this._listAbortController = null;
    });

    this._listAbortController = abortController;

    const languages = (
      [...bundledLanguagesInfo, PLAIN_TEXT_LANG_INFO] as StrictLanguageInfo[]
    ).map(lang => ({
      label: lang.name,
      name: lang.id,
      aliases: lang.aliases,
    }));

    const list = new FilterableListComponent();

    list.listFilter = (a, b) =>
      getLanguagePriority(a.name as BundledLanguage) -
      getLanguagePriority(b.name as BundledLanguage);

    list.options = {
      placeholder: 'Search for a language',
      onSelect: item => {
        this.blockElement.setLang(item.name);
        this._updateLanguage();
      },
      active: item => item.name === this._curLanguage.id,
      items: languages,
    };

    list.abortController = abortController;

    popFilterableList({
      list,
      referenceElement: this._langButton,
      abortController,
    });
  }

  override render() {
    const popperVisible = !!this._listAbortController;
    const visible = this._visible || popperVisible;

    return html`<icon-button
      class="lang-button"
      data-visible=${visible}
      data-testid="lang-button"
      width="auto"
      height="24px"
      @click=${this._popList}
      ?disabled=${this.doc.readonly}
      ?hover=${popperVisible}
    >
      ${this._curLanguage.name ?? this._curLanguage.id}
      ${!this.doc.readonly ? ArrowDownIcon : nothing}
    </icon-button> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_LANGUAGE_LIST_WIDGET]: AffineCodeLanguageListWidget;
  }
}
