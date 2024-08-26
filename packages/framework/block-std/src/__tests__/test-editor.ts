import type { Doc } from '@blocksuite/store';
import type { Ref } from 'lit/directives/ref.js';

import { SignalWatcher } from '@lit-labs/preact-signals';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import type { BlockSpec } from '../spec/type.js';
import type { EditorHost } from '../view/index.js';

import { ShadowlessElement, WithDisposable } from '../view/index.js';

@customElement('test-editor-container')
export class TestEditorContainer extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  editorRef: Ref<EditorHost> = createRef();

  protected override render() {
    return html` <div class="test-editor-container">
      <editor-host
        ${ref(this.editorRef)}
        .doc=${this.doc}
        .specs=${this.specs}
      ></editor-host>
    </div>`;
  }

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor specs: BlockSpec[] = [];
}
