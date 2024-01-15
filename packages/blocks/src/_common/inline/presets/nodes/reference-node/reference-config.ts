import type { Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

export class ReferenceNodeConfig {
  private _customIcon: TemplateResult | null = null;
  private _customTitle: string | null = null;
  private _customContent: TemplateResult | null = null;
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

  setCustomContent(content: TemplateResult | null) {
    this._customContent = content;
  }

  setCustomIcon(icon: TemplateResult | null) {
    this._customIcon = icon;
  }

  setCustomTitle(title: string | null) {
    this._customTitle = title;
  }

  setPage(page: Page | null) {
    this._page = page;
  }
}
