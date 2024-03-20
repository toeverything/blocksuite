// related component
import '../database-block/table/table-view.js';

import { BlockElement, RangeManager } from '@blocksuite/block-std';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { DataViewBlockModel } from './data-view-model.js';

@customElement('affine-data-view')
export class DataViewBlockComponent extends BlockElement<DataViewBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');
  }

  override renderBlock() {
    // data-view block has been deprecated
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view': DataViewBlockComponent;
  }
}
