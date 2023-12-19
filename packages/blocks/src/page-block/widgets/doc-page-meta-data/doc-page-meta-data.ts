import { assertExists } from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';

import { getDocPageByEditorHost } from '../../../_common/utils/query.js';
import { PageMetaData } from './components/meta-data.js';

export const AFFINE_DOC_PAGE_META_DATA = 'affine-page-meta-data-widget';

@customElement(AFFINE_DOC_PAGE_META_DATA)
export class DocPageMetaDataWidget extends WidgetElement {
  override connectedCallback() {
    super.connectedCallback();

    this.host.updateComplete
      .then(() => {
        const docPageElement = getDocPageByEditorHost(this.host);
        assertExists(docPageElement);

        const pageMetaData = new PageMetaData(this.page, docPageElement);

        const pageTitleContainer = this.host.querySelector(
          '.affine-doc-page-block-title-container'
        );
        assertExists(pageTitleContainer);

        // FIXME(Flrande): It is not a best practice,
        // but merely a temporary measure for reusing previous components.
        pageTitleContainer.appendChild(pageMetaData);
      })
      .catch(console.error);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_DOC_PAGE_META_DATA]: DocPageMetaDataWidget;
  }
}
