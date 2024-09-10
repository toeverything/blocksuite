import type { BlockStdScope } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import type { AffineReference } from './reference-node.js';

export class ReferenceNodeConfig {
  private _customContent:
    | ((reference: AffineReference) => TemplateResult)
    | null = null;

  private _customIcon: ((reference: AffineReference) => TemplateResult) | null =
    null;

  private _customTitle: ((reference: AffineReference) => string) | null = null;

  private _interactable = true;

  get customContent() {
    return this._customContent;
  }

  get customIcon() {
    return this._customIcon;
  }

  get customTitle() {
    return this._customTitle;
  }

  get doc() {
    return this.std.doc;
  }

  get interactable() {
    return this._interactable;
  }

  constructor(readonly std: BlockStdScope) {}

  setCustomContent(content: ReferenceNodeConfig['_customContent']) {
    this._customContent = content;
  }

  setCustomIcon(icon: ReferenceNodeConfig['_customIcon']) {
    this._customIcon = icon;
  }

  setCustomTitle(title: ReferenceNodeConfig['_customTitle']) {
    this._customTitle = title;
  }

  setInteractable(interactable: boolean) {
    this._interactable = interactable;
  }
}
