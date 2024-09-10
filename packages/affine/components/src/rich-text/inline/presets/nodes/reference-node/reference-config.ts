import type { BlockStdScope, ExtensionType } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import { createIdentifier } from '@blocksuite/global/di';

import type { AffineReference } from './reference-node.js';

export interface ReferenceNodeConfig {
  customContent?: ((reference: AffineReference) => TemplateResult) | null;
  customIcon?: ((reference: AffineReference) => TemplateResult) | null;
  customTitle?: ((reference: AffineReference) => string) | null;
  interactable?: boolean;
}

export const ReferenceNodeConfigIdentifier =
  createIdentifier<ReferenceNodeConfig>('AffineReferenceNodeConfig');

export function ReferenceNodeConfigExtension(
  config: ReferenceNodeConfig
): ExtensionType {
  return {
    setup: di => {
      di.addImpl(ReferenceNodeConfigIdentifier, () => ({ ...config }));
    },
  };
}

export class ReferenceNodeConfigProvider {
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

  setCustomContent(content: ReferenceNodeConfigProvider['_customContent']) {
    this._customContent = content;
  }

  setCustomIcon(icon: ReferenceNodeConfigProvider['_customIcon']) {
    this._customIcon = icon;
  }

  setCustomTitle(title: ReferenceNodeConfigProvider['_customTitle']) {
    this._customTitle = title;
  }

  setInteractable(interactable: boolean) {
    this._interactable = interactable;
  }
}
