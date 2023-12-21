import type { RichText } from '@blocksuite/blocks';
import { type PageBlockModel } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}

const PAGE_BLOCK_CHILD_PADDING = 24;

@customElement('doc-title')
export class DocTitle extends WithDisposable(ShadowlessElement) {
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
      cursor: text;
      padding: 38px 0;

      padding-left: var(
        --affine-editor-side-padding,
        ${PAGE_BLOCK_CHILD_PADDING}px
      );
      padding-right: var(
        --affine-editor-side-padding,
        ${PAGE_BLOCK_CHILD_PADDING}px
      );
    }

    /* Extra small devices (phones, 640px and down) */
    @media screen and (max-width: 640px) {
      .doc-title-container {
        padding-left: ${PAGE_BLOCK_CHILD_PADDING}px;
        padding-right: ${PAGE_BLOCK_CHILD_PADDING}px;
      }
    }

    .doc-title-container-empty::before {
      content: 'Title';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
    }

    .doc-title-container:disabled {
      background-color: transparent;
    }
  `;

  @property({ attribute: false })
  page!: Page;

  @state()
  private _isComposing = false;

  @query('rich-text')
  private _richTextElement!: RichText;

  private get _pageModel() {
    return this.page.root as PageBlockModel;
  }

  private get _inlineEditor() {
    return this._richTextElement.inlineEditor;
  }

  private get _docPageElement() {
    const docViewport = this.closest('.affine-doc-viewport') as HTMLElement;
    assertExists(docViewport);
    const docPageElement = docViewport.querySelector('affine-doc-page');
    assertExists(docPageElement);
    return docPageElement;
  }

  private _onTitleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || this.page.readonly) return;
    const hasContent = !this.page.isEmpty;

    if (event.key === 'Enter' && hasContent && !event.isComposing) {
      event.preventDefault();

      const inlineEditor = this._inlineEditor;
      assertExists(inlineEditor);
      const inlineRange = inlineEditor.getInlineRange();
      assertExists(inlineRange);

      const rightText = this._pageModel.title.split(inlineRange.index);
      this._docPageElement.prependParagraphWithText(rightText);
    } else if (event.key === 'ArrowDown' && hasContent) {
      event.preventDefault();

      this._docPageElement.focusFirstParagraph();
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  };

  private _updateTitleInMeta = () => {
    this.page.workspace.setPageMeta(this.page.id, {
      title: this._pageModel.title.toString(),
    });
  };

  // private _initTitleInlineEditor() {
  //   const title = this._pageModel.title;
  //   this._titleInlineEditor = new InlineEditor(title.yText);
  //   this._titleInlineEditor.mount(this._titleContainer);
  //
  //   this._titleInlineEditor.disposables.addFromEvent(
  //     this._titleContainer,
  //     'copy',
  //     this._onTitleCopy
  //   );
  //   this._titleInlineEditor.disposables.addFromEvent(
  //     this._titleContainer,
  //     'paste',
  //     this._onTitlePaste
  //   );
  //
  //   this._titleInlineEditor.setReadonly(this.page.readonly);
  // }

  // private _onTitleCopy = (event: ClipboardEvent) => {
  //   event.stopPropagation();

  //   const inlineEditor = this._titleInlineEditor;
  //   const inlineRange = inlineEditor.getInlineRange();
  //   if (!inlineRange) return;

  //   const toBeCopiedText = inlineEditor.yText
  //     .toString()
  //     .substring(inlineRange.index, inlineRange.index + inlineRange.length);
  //   event.clipboardData?.setData('text/plain', toBeCopiedText);
  // };

  // private _onTitlePaste = (event: ClipboardEvent) => {
  //   event.stopPropagation();

  //   const inlineEditor = this._titleInlineEditor;
  //   const inlineRange = inlineEditor.getInlineRange();
  //   if (!inlineRange) return;

  //   const data = event.clipboardData?.getData('text/plain');
  //   if (data) {
  //     const text = data.replace(/(\r\n|\r|\n)/g, '\n');
  //     inlineEditor.insertText(inlineRange, text);
  //     inlineEditor.setInlineRange({
  //       index: inlineRange.index + text.length,
  //       length: 0,
  //     });
  //   }
  // };

  // private _initReadonlyListener() {
  //   let readonly = this.page.readonly;
  //   this._disposables.add(
  //     this.page.awarenessStore.slots.update.on(() => {
  //       assertExists(this._titleInlineEditor);
  //       if (readonly !== this.page.readonly) {
  //         readonly = this.page.readonly;
  //         this._titleInlineEditor.setReadonly(readonly);
  //       }
  //     })
  //   );
  // }

  // override firstUpdated() {
  //   this._initTitleInlineEditor();
  //   this._initReadonlyListener();
  // }

  override connectedCallback() {
    super.connectedCallback();

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

    this._pageModel.title.yText.observe(() => {
      this._updateTitleInMeta();
      this.requestUpdate();
    });
  }

  override render() {
    const isEmpty = !this._pageModel.title.length && !this._isComposing;

    return html`
      <div
        class="doc-title-container ${isEmpty
          ? 'doc-title-container-empty'
          : ''}"
        data-block-is-title="true"
      >
        <rich-text
          .yText=${this._pageModel.title.yText}
          .undoManager=${this._pageModel.page.history}
          .readonly=${this._pageModel.page.readonly}
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
