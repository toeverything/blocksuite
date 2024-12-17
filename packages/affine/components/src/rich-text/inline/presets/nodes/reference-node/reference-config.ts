import type { BlockStdScope, ExtensionType } from '@blocksuite/block-std';
import type { TemplateResult } from 'lit';

import { createIdentifier } from '@blocksuite/global/di';

import type { AffineReference } from './reference-node.js';

export interface ReferenceNodeConfig {
  customContent?: (reference: AffineReference) => TemplateResult;
  interactable?: boolean;
  hidePopup?: boolean;
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
    | undefined = undefined;

  private _hidePopup = false;

  private _interactable = true;

  get customContent() {
    return this._customContent;
  }

  get doc() {
    return this.std.doc;
  }

  get hidePopup() {
    return this._hidePopup;
  }

  get interactable() {
    return this._interactable;
  }

  constructor(readonly std: BlockStdScope) {}

  setCustomContent(content: ReferenceNodeConfigProvider['_customContent']) {
    this._customContent = content;
  }

  setHidePopup(hidePopup: boolean) {
    this._hidePopup = hidePopup;
  }

  setInteractable(interactable: boolean) {
    this._interactable = interactable;
  }
}
