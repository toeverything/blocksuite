import '../../../components/tags/multi-tag-select.js';
import '../../../components/tags/multi-tag-view.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { BlockHost } from '../../../__internal__/index.js';
import type { SelectTag } from '../../../components/tags/multi-tag-select.js';
import { popTagSelect } from '../../../components/tags/multi-tag-select.js';

@customElement('affine-page-meta-data')
export class PageMetaData extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    affine-page-meta-data .meta-hover:hover {
      background-color: var(--affine-hover-color);
      cursor: pointer;
    }

    affine-page-meta-data .meta-data {
      width: 100%;
      display: flex;
    }

    affine-page-meta-data .meta-data .meta-data-type {
      width: 200px;
      padding: 4px;
      border-radius: 4px;
    }

    affine-page-meta-data .meta-data .meta-data-value {
      flex: 1;
      padding: 4px;
      border-radius: 4px;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  host!: BlockHost;

  get meta() {
    return this.page.workspace.meta;
  }

  get options() {
    return this.meta.allPagesMeta.tags.options;
  }

  set options(tags: SelectTag[]) {
    this.page.workspace.meta.setAllPagesMeta({
      ...this.meta.allPagesMeta,
      tags: {
        ...this.meta.allPagesMeta.tags,
        options: tags,
      },
    });
  }

  get tags() {
    return this.page.meta.tags ?? [];
  }

  set tags(tags: string[]) {
    this.page.meta.tags = tags;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.meta.pageMetasUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  @state()
  showSelect = false;
  _selectTags = (evt: MouseEvent) => {
    popTagSelect(evt.currentTarget as HTMLElement, {
      value: this.tags,
      onChange: tags => (this.tags = tags),
      options: this.options,
      onOptionsChange: options => (this.options = options),
    });
  };

  override render() {
    const tags = this.page.meta.tags ?? [];
    return html` <div
      @mousedown="${e => e.stopPropagation()}"
      class="meta-data"
    >
      <div class="meta-data-type meta-hover">Tags</div>
      <div class="meta-data-value meta-hover" @click="${this._selectTags}">
        ${tags.length
          ? html` <affine-multi-tag-view
              .value="${this.tags}"
              .options="${this.options}"
            ></affine-multi-tag-view>`
          : html`Empty`}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-meta-data': PageMetaData;
  }
}
