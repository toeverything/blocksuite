import { assertExists } from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';

import { getDocPage } from '../../utils/query.js';
import { PageMetaData } from './components/meta-data.js';

export const AFFINE_DOC_PAGE_META_DATA = 'affine-page-meta-data-widget';

@customElement(AFFINE_DOC_PAGE_META_DATA)
export class DocPageMetaDataWidget extends WidgetElement {
  override connectedCallback() {
    super.connectedCallback();

    this.root.updateComplete.then(() => {
      const pageElement = getDocPage(this.page);
      assertExists(pageElement);

      const pageMetaData = new PageMetaData(this.page, pageElement);

      const pageTitleContainer = this.root.querySelector(
        '.affine-doc-page-block-title-container'
      );
      assertExists(pageTitleContainer);

      pageTitleContainer.appendChild(pageMetaData);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_DOC_PAGE_META_DATA]: DocPageMetaDataWidget;
  }
}
