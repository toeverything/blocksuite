import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { BLOCK_ID_ATTR } from '../../../../_common/consts.js';
import { EditIcon } from '../../../../_common/icons/text.js';
import { toggleBookmarkEditModal } from '../../../../bookmark-block/components/index.js';
import type { BookmarkBlockComponent } from '../../../../index.js';
import type { BookmarkBlockModel } from '../../../../models.js';
import type { SurfaceBlockComponent } from '../../../../surface-block/surface-block.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';

@customElement('edgeless-change-bookmark-button')
export class EdgelessChangeBookmarkButton extends WithDisposable(LitElement) {
  static override styles = css`
    .change-bookmark-container {
      display: flex;
    }
  `;

  @property({ attribute: false })
  bookmark!: BookmarkBlockModel;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

  override render() {
    return html`<div class="change-bookmark-container">
      <icon-button
        size="32px"
        ?disabled=${this.page.readonly}
        @click=${() => {
          const bookmark =
            this.surface.edgeless.querySelector<BookmarkBlockComponent>(
              `[${BLOCK_ID_ATTR}="${this.bookmark.id}"]`
            );
          assertExists(bookmark);
          toggleBookmarkEditModal(bookmark);
        }}
      >
        ${EditIcon}
        <affine-tooltip .offset=${12}>Edit</affine-tooltip>
      </icon-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-bookmark-button': EdgelessChangeBookmarkButton;
  }
}
