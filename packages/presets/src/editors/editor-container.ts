import type { BlockModel, Doc } from '@blocksuite/store';

import {
  BlockStdScope,
  type ExtensionType,
  ShadowlessElement,
} from '@blocksuite/block-std';
import {
  type AbstractEditor,
  type DocMode,
  EdgelessEditorBlockSpecs,
  PageEditorBlockSpecs,
} from '@blocksuite/blocks';
import { SignalWatcher, Slot, WithDisposable } from '@blocksuite/global/utils';
import { computed, signal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { when } from 'lit/directives/when.js';

export class AffineEditorContainer
  extends SignalWatcher(WithDisposable(ShadowlessElement))
  implements AbstractEditor
{
  static override styles = css`
    .affine-page-viewport {
      position: relative;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
      container-name: viewport;
      container-type: inline-size;
      font-family: var(--affine-font-family);
    }
    .affine-page-viewport * {
      box-sizing: border-box;
    }

    @media print {
      .affine-page-viewport {
        height: auto;
      }
    }

    .playground-page-editor-container {
      flex-grow: 1;
      font-family: var(--affine-font-family);
      display: block;
    }

    .playground-page-editor-container * {
      box-sizing: border-box;
    }

    @media print {
      .playground-page-editor-container {
        height: auto;
      }
    }

    .edgeless-editor-container {
      font-family: var(--affine-font-family);
      background: var(--affine-background-primary-color);
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
    }

    .edgeless-editor-container * {
      box-sizing: border-box;
    }

    @media print {
      .edgeless-editor-container {
        height: auto;
      }
    }

    .affine-edgeless-viewport {
      display: block;
      height: 100%;
      position: relative;
      overflow: clip;
      container-name: viewport;
      container-type: inline-size;
    }
  `;

  private _doc = signal<Doc>();

  private _edgelessSpecs = signal<ExtensionType[]>(EdgelessEditorBlockSpecs);

  private _editorTemplate = computed(() => {
    return this._std.value.render();
  });

  private _mode = signal<DocMode>('page');

  private _pageSpecs = signal<ExtensionType[]>(PageEditorBlockSpecs);

  private _specs = computed(() =>
    this._mode.value === 'page'
      ? this._pageSpecs.value
      : this._edgelessSpecs.value
  );

  private _std = computed(() => {
    return new BlockStdScope({
      doc: this.doc,
      extensions: this._specs.value,
    });
  });

  /**
   * @deprecated need to refactor
   */
  slots: AbstractEditor['slots'] = {
    docUpdated: new Slot(),
  };

  get doc() {
    return this._doc.value as Doc;
  }

  set doc(doc: Doc) {
    this._doc.value = doc;
  }

  set edgelessSpecs(specs: ExtensionType[]) {
    this._edgelessSpecs.value = specs;
  }

  get edgelessSpecs() {
    return this._edgelessSpecs.value;
  }

  get host() {
    try {
      return this.std.host;
    } catch {
      return null;
    }
  }

  get mode() {
    return this._mode.value;
  }

  set mode(mode: DocMode) {
    this._mode.value = mode;
  }

  set pageSpecs(specs: ExtensionType[]) {
    this._pageSpecs.value = specs;
  }

  get pageSpecs() {
    return this._pageSpecs.value;
  }

  get rootModel() {
    return this.doc.root as BlockModel;
  }

  get std() {
    return this._std.value;
  }

  /**
   * @deprecated need to refactor
   */
  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.doc.slots.rootAdded.on(() => this.requestUpdate())
    );
  }

  override firstUpdated() {
    if (this.mode === 'page') {
      setTimeout(() => {
        if (this.autofocus) {
          const richText = this.querySelector('rich-text');
          const inlineEditor = richText?.inlineEditor;
          inlineEditor?.focusEnd();
        }
      });
    }
  }

  override render() {
    const mode = this._mode.value;

    return html`${keyed(
      this.rootModel.id + mode,
      html`
        <div
          class=${mode === 'page'
            ? 'affine-page-viewport'
            : 'affine-edgeless-viewport'}
        >
          ${when(
            mode === 'page',
            () => html` <doc-title .doc=${this.doc}></doc-title> `
          )}
          <div
            class=${mode === 'page'
              ? 'page-editor playground-page-editor-container'
              : 'edgeless-editor-container'}
          >
            ${this._editorTemplate.value}
          </div>
        </div>
      `
    )}`;
  }

  switchEditor(mode: DocMode) {
    this._mode.value = mode;
  }

  /**
   * @deprecated need to refactor
   */
  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('doc')) {
      this.slots.docUpdated.emit({ newDocId: this.doc.id });
    }

    if (!changedProperties.has('doc') && !changedProperties.has('mode')) {
      return;
    }
  }

  @property({ attribute: false })
  override accessor autofocus = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-editor-container': AffineEditorContainer;
  }
}
