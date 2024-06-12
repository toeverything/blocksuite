import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { RichText } from '@blocksuite/blocks';
import type { RootBlockModel } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

const DOC_BLOCK_CHILD_PADDING = 24;

@customElement('doc-title')
export class DocTitle extends WithDisposable(ShadowlessElement) {
  private get _rootModel() {
    return this.doc.root as RootBlockModel;
  }

  private get _inlineEditor() {
    return this._richTextElement.inlineEditor;
  }

  private get _viewport() {
    const el = this.closest<HTMLElement>('.affine-page-viewport');
    assertExists(el);
    return el;
  }

  private get _pageRoot() {
    const pageRoot = this._viewport.querySelector('affine-page-root');
    assertExists(pageRoot);
    return pageRoot;
  }

  static override styles = css`
    .doc-title-container {
      box-sizing: border-box;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-size: 40px;
      line-height: 50px;
      font-weight: 700;
      outline: none;
      resize: none;
      border: 0;
      width: 100%;
      max-width: var(--affine-editor-width);
      margin-left: auto;
      margin-right: auto;
      padding: 38px 0;

      padding-left: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}px
      );
      padding-right: var(
        --affine-editor-side-padding,
        ${DOC_BLOCK_CHILD_PADDING}px
      );
    }

    /* Extra small devices (phones, 640px and down) */
    @container viewport (width <= 640px) {
      .doc-title-container {
        padding-left: ${DOC_BLOCK_CHILD_PADDING}px;
        padding-right: ${DOC_BLOCK_CHILD_PADDING}px;
      }
    }

    .doc-title-container-empty::before {
      content: 'Title';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
      pointer-events: none;
    }

    .doc-title-container:disabled {
      background-color: transparent;
    }
  `;

  @state()
  private accessor _isReadonly = false;

  @state()
  private accessor _isComposing = false;

  @query('rich-text')
  private accessor _richTextElement!: RichText;

  @property({ attribute: false })
  accessor doc!: Doc;

  private _onTitleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || this.doc.readonly) return;
    const hasContent = !this.doc.isEmpty;

    if (event.key === 'Enter' && hasContent && !event.isComposing) {
      event.preventDefault();

      const inlineEditor = this._inlineEditor;
      assertExists(inlineEditor);
      const inlineRange = inlineEditor.getInlineRange();
      assertExists(inlineRange);

      const rightText = this._rootModel.title.split(inlineRange.index);
      this._pageRoot.prependParagraphWithText(rightText);
    } else if (event.key === 'ArrowDown' && hasContent) {
      event.preventDefault();
      this._pageRoot.focusFirstParagraph();
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  };

  private _updateTitleInMeta = () => {
    this.doc.collection.setDocMeta(this.doc.id, {
      title: this._rootModel.title.toString(),
    });
  };

  override connectedCallback() {
    super.connectedCallback();

    this._isReadonly = this.doc.readonly;
    this._disposables.add(
      this.doc.awarenessStore.slots.update.on(() => {
        if (this._isReadonly !== this.doc.readonly) {
          this._isReadonly = this.doc.readonly;
          this.requestUpdate();
        }
      })
    );

    this._disposables.addFromEvent(this, 'keydown', this._onTitleKeyDown);

    // Workaround for inline editor skips composition event
    this._disposables.addFromEvent(
      this,
      'compositionstart',
      () => (this._isComposing = true)
    );

    this._disposables.addFromEvent(
      this,
      'compositionend',
      () => (this._isComposing = false)
    );

    const updateMetaTitle = () => {
      this._updateTitleInMeta();
      this.requestUpdate();
    };
    this._rootModel.title.yText.observe(updateMetaTitle);
    this._disposables.add(() => {
      this._rootModel.title.yText.unobserve(updateMetaTitle);
    });
  }

  override render() {
    const isEmpty = !this._rootModel.title.length && !this._isComposing;

    return html`
      <div
        class="doc-title-container ${isEmpty
          ? 'doc-title-container-empty'
          : ''}"
        data-block-is-title="true"
      >
        <rich-text
          .yText=${this._rootModel.title.yText}
          .undoManager=${this.doc.history}
          .verticalScrollContainerGetter=${() => this._viewport}
          .readonly=${this.doc.readonly}
          .enableFormat=${false}
        ></rich-text>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'doc-title': DocTitle;
  }
}
