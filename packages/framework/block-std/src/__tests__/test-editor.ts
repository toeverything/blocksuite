import type { Doc } from '@blocksuite/store';

import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { ExtensionType } from '../extension/index.js';

import { BlockStdScope } from '../scope/index.js';
import {
  ShadowlessElement,
  WithDisposable,
  SignalWatcher,
} from '../view/index.js';

@customElement('test-editor-container')
export class TestEditorContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  private _std!: BlockStdScope;

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

  get std() {
    return this._std;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs: ExtensionType[] = [];
}
