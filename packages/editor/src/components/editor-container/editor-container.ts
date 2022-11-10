import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import type { Space } from '@blocksuite/store';
import { DisposableGroup, Signal } from '@blocksuite/store';
import { ClipboardManager, ContentParser } from '../..';
import { BlockSchema } from '../../block-loader';

type PageBlockModel = InstanceType<typeof BlockSchema['affine:page']>;

declare global {
  interface HTMLElementTagNameMap {
    'editor-container': EditorContainer;
  }
}

@customElement('editor-container')
export class EditorContainer extends LitElement {
  /**
   * @internal
   * Resolve the readiness of the editor, on {@link EditorContainer.editorReady}
   *
   * TODO: rootAdded signal doesn't seem to trigger for completely empty documents...
   * So, in cases where we stat on a blank page, we won't know the editor is ready...
   */
  #resolveReady: undefined | (() => void) = undefined;
  /**
   * Wait for the editor to be ready.
   * Once the editor is ready, we can safely access the {@link EditorContainer.model}.
   */
  editorReady = new Promise<void>(res => {
    this.#resolveReady = () => ((this.#resolveReady = undefined), res());
  });

  @property()
  space!: Space;

  @state()
  mode: 'page' | 'edgeless' = 'page';

  @state()
  model!: PageBlockModel;

  // TODO only select block
  @state()
  clipboard = new ClipboardManager(this, this);

  @state()
  contentParser = new ContentParser(this);

  @state()
  isEmptyPage = true;

  @query('.affine-block-placeholder-input')
  private _placeholderInput!: HTMLInputElement;

  @state()
  placeholderModel!: PageBlockModel;

  disposables = new DisposableGroup();

  update(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('space')) {
      this.placeholderModel = new BlockSchema['affine:page'](this.space, {});
    }
    super.update(changedProperties);
  }

  private _subscribeStore() {
    // if undo to empty page, reset to empty placeholder
    this.disposables.add(
      this.space.signals.updated.on(() => {
        this.isEmptyPage = this.space.isEmpty;
      })
    );

    // keep track of disposeables that should be disposed on each model replacement
    let currentRootDisposable: DisposableGroup | undefined;
    this.disposables.add(() => currentRootDisposable?.dispose());
    this.disposables.add(
      this.space.signals.rootAdded.on(block => {
        currentRootDisposable?.dispose();
        currentRootDisposable = new DisposableGroup();
        // Question: Should we destroy the block on disposal?
        // maybe not if we have multiple editors?
        // currentRootDisposable.add(block);

        this.model = block as PageBlockModel;
        currentRootDisposable.add(
          this.model.childrenUpdated.on(() => this.requestUpdate())
        );
        this.requestUpdate();

        this.#resolveReady?.();
      })
    );
  }

  // disable shadow DOM to workaround quill
  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();

    if (!this.space) {
      throw new Error("EditorContainer's store is not set!");
    }
    this.placeholderModel = new BlockSchema['affine:page'](this.space, {});

    this.disposables.add(
      Signal.fromEvent(window, 'affine.switch-mode').on(({ detail }) => {
        this.mode = detail;
      })
    );

    this._subscribeStore();

    this._placeholderInput?.focus();
  }

  disconnectedCallback() {
    this.disposables.dispose();
    this.disposables = new DisposableGroup();
  }

  render() {
    const placeholderRoot = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
        .model=${this.placeholderModel}
      ></default-page-block>
    `;

    const pageContainer = html`
      <default-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
        .model=${this.model}
      ></default-page-block>
    `;

    const edgelessContainer = html`
      <edgeless-page-block
        .mouseRoot=${this as HTMLElement}
        .space=${this.space}
        .model=${this.model}
      ></edgeless-page-block>
    `;

    const blockRoot = html`
      ${choose(this.mode, [
        ['page', () => pageContainer],
        ['edgeless', () => edgelessContainer],
      ])}
    `;

    return html`
      <style>
        .affine-editor-container {
          height: 100%;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
        }
      </style>
      <div class="affine-editor-container">
        ${this.isEmptyPage ? placeholderRoot : blockRoot}
        <debug-menu
          .space=${this.space}
          .contentParser=${this.contentParser}
        ></debug-menu>
      </div>
    `;
  }
}
