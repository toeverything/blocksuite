import type { Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { AffineReference } from './reference-node.js';

export class ReferenceNodeConfig {
  private _customIcon: ((reference: AffineReference) => TemplateResult) | null =
    null;
  private _customTitle: ((reference: AffineReference) => string) | null = null;
  private _customContent:
    | ((reference: AffineReference) => TemplateResult)
    | null = null;
  private _page: Page | null = null;

  get customIcon() {
    return this._customIcon;
  }

  get customTitle() {
    return this._customTitle;
  }

  get page() {
    return this._page;
  }

  get customContent() {
    return this._customContent;
  }

  setCustomContent(content: ReferenceNodeConfig['_customContent']) {
    this._customContent = content;
  }

  setCustomIcon(icon: ReferenceNodeConfig['_customIcon']) {
    this._customIcon = icon;
  }

  setCustomTitle(title: ReferenceNodeConfig['_customTitle']) {
    this._customTitle = title;
  }

  setPage(page: Page | null) {
    this._page = page;
  }
}
