import './components/index.js';
import '../_common/components/button.js';
import './doc-bookmark-block.js';
import './edgeless-bookmark-block.js';

import { Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type { BookmarkBlockModel } from './bookmark-model.js';
import type { DocBookmarkBlockComponent } from './doc-bookmark-block.js';
import type { EdgelessBookmarkBlockComponent } from './edgeless-bookmark-block.js';
import { refreshBookmarkUrlData } from './utils.js';

@customElement('affine-bookmark')
export class BookmarkBlockComponent extends BlockElement<BookmarkBlockModel> {
  @property({ attribute: false })
  loading = false;

  @query('affine-edgeless-bookmark, affine-doc-bookmark')
  edgelessOrDocBookmark?:
    | EdgelessBookmarkBlockComponent
    | DocBookmarkBlockComponent;

  readonly slots = {
    loadingUpdated: new Slot(),
  };

  override connectedCallback() {
    super.connectedCallback();
    if (!this.model.description) {
      refreshBookmarkUrlData(this);
    }

    this.disposables.add(
      this.model.propsUpdated.on(({ key }) => {
        this.edgelessOrDocBookmark?.requestUpdate();
        if (key === 'url') {
          refreshBookmarkUrlData(this);
        }
      })
    );
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('loading')) {
      this.slots.loadingUpdated.emit();
    }
  }

  override render() {
    const parent = this.host.page.getParent(this.model);
    const isInSurface = parent?.flavour === 'affine:surface';

    if (isInSurface) {
      return html`<affine-edgeless-bookmark
        .block=${this}
      ></affine-edgeless-bookmark>`;
    } else {
      return html`<affine-doc-bookmark .block=${this}></affine-doc-bookmark>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-bookmark': BookmarkBlockComponent;
  }
}
