// related component
import '../database-block/table/table-view.js';

import { BlockElement } from '@blocksuite/lit';
import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { DataViewBlockModel } from './data-view-model.js';

@customElement('affine-data-view')
export class DataViewBlockComponent extends BlockElement<DataViewBlockModel> {
  override render() {
    // data-view block has been deprecated
    return nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view': DataViewBlockComponent;
  }
}
