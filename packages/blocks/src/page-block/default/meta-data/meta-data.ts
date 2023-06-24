import '../../../components/tags/multi-tag-select.js';
import '../../../components/tags/multi-tag-view.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { BlockHost } from '../../../__internal__/index.js';
import type { SelectTag } from '../../../database-block/index.js';
import { onClickOutside } from '../../../database-block/utils/utils.js';

@customElement('affine-page-meta-data')
export class PageMetaData extends WithDisposable(ShadowlessElement) {
  static override styles = css``;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  host!: BlockHost;

  get meta() {
    return this.page.workspace.meta;
  }

  get tags() {
    return this.meta.allPagesMeta.tags.options;
  }

  set tags(tags: SelectTag[]) {
    this.page.workspace.meta.setAllPagesMeta({
      ...this.meta.allPagesMeta,
      tags: {
        ...this.meta.allPagesMeta.tags,
        options: tags,
      },
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.meta.pageMetasUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  _onOptionsChange = (options: SelectTag[]) => {
    this.tags = options;
  };
  @state()
  showSelect = false;
  _selectTags = () => {
    this.showSelect = true;
    onClickOutside(
      this.querySelector('affine-multi-tag-select') ?? this,
      () => {
        this.showSelect = false;
      },
      'mousedown'
    );
  };

  override render() {
    const tags = this.page.meta.tags ?? [];
    return html` <div
      @mousedown="${e => e.stopPropagation()}"
      style="display:flex;align-items:center;padding: 8px 0px;"
    >
      <div style="margin-right: 4px;">Tags:</div>
      <div @click="${this._selectTags}" style="position: relative;flex: 1;">
        ${tags.length
          ? html` <affine-multi-tag-view
              .value="${tags}"
              .options="${this.meta.allPagesMeta.tags.options}"
            ></affine-multi-tag-view>`
          : html`No Tag`}
        ${this.showSelect
          ? html` <affine-multi-tag-select
              style="position: absolute;left: -4px;top: -6px;width: 100%;"
              .value="${this.page.meta.tags ?? []}"
              .options="${this.page.workspace.meta.allPagesMeta.tags.options}"
              .onOptionsChange="${this._onOptionsChange}"
              .onChange="${tags => (this.page.meta.tags = tags)}"
            ></affine-multi-tag-select>`
          : null}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-meta-data': PageMetaData;
  }
}
