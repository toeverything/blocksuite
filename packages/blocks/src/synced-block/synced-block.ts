import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';

import { DocEditorBlockSpecs } from '../_specs/_specs.js';
import type { SyncedBlockModel } from './synced-model.js';

@customElement('affine-synced')
export class SyncedBlockComponent extends BlockElement<SyncedBlockModel> {
  override render() {
    const page = this.std.workspace.getPage(this.model.pageId);
    assertExists(page);
    return this.host.renderSpecPortal(page, DocEditorBlockSpecs);
  }
}
