import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { DocEditorBlockSpecs } from '../_specs/_specs.js';
import type { SyncedBlockModel } from './synced-model.js';

@customElement('affine-synced')
export class SyncedBlockComponent extends BlockElement<SyncedBlockModel> {
  static override styles = css`
    .affine-synced-block.selected {
      outline: 2px solid var(--affine-brand-color);
      outline-offset: -2px;
    }
  `;

  private get _linkedDoc() {
    const page = this.std.workspace.getPage(this.model.pageId);
    return page;
  }

  override render() {
    const linkedDoc = this._linkedDoc;
    assertExists(linkedDoc);

    const selected = this.selected?.is('block');

    return html`<div class="affine-synced-block ${selected ? 'selected' : ''}">
      ${this.host.renderSpecPortal(linkedDoc, DocEditorBlockSpecs)}
    </div>`;
  }
}
