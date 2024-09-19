import type { Doc } from '@blocksuite/store';

import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ExtensionType } from '../extension/index.js';

import { BlockStdScope } from '../scope/index.js';
import { ShadowlessElement } from '../view/index.js';

@customElement('test-editor-container')
export class TestEditorContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _std!: BlockStdScope;

  get std() {
    return this._std;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._std = new BlockStdScope({
      doc: this.doc,
      extensions: this.specs,
    });
  }

  protected override render() {
    return html` <div class="test-editor-container">
      ${this._std.render()}
    </div>`;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs: ExtensionType[] = [];
}
