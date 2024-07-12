import type {
  AffineInlineEditor,
  FrameBlockModel,
  RichText,
} from '@blocksuite/blocks';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

const styles = css`
  frame-card-title-editor rich-text .nowrap-lines::-webkit-scrollbar {
    display: none;
  }
`;

export class FrameCardTitleEditor extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  private _isComposing = false;

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.remove();
    this.titleContentElement.style.display = 'block';
  }

  override firstUpdated(): void {
    this.updateComplete
      .then(() => {
        this.titleContentElement.style.display = 'none';

        this.inlineEditor.selectAll();

        this.inlineEditor.slots.renderComplete.on(() => {
          this.requestUpdate();
        });

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => {
            this._unmount();
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'click',
          e => {
            e.stopPropagation();
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'dblclick',
          e => {
            e.stopPropagation();
          }
        );

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'keydown',
          e => {
            e.stopPropagation();
            if (e.key === 'Enter' && !this._isComposing) {
              this._unmount();
            }
          }
        );
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const inlineEditorStyle = styleMap({
      background: 'var(--affine-background-primary-color)',
      border: '1px solid var(--affine-primary-color)',
      borderRadius: '4px',
      boxShadow: '0px 0px 0px 2px rgba(30, 150, 235, 0.30)',
      color: 'var(--affine-text-primary-color)',
      display: 'block',
      fontSize: 'var(--affine-font-sm)',
      height: '20px',
      left: `${this.left}px`,
      lineHeight: '20px',
      maxHeight: '20px',
      maxWidth: `${this.maxWidth}px`,
      minWidth: '8px',
      position: 'absolute',
      top: '0px',
      transformOrigin: 'top left',
      width: 'fit-content',
      zIndex: '1',
    });
    return html`<rich-text
      .yText=${this.frameModel.title.yText}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${true}
      .enableUndoRedo=${false}
      .wrapText=${false}
      style=${inlineEditorStyle}
    ></rich-text>`;
  }

  get inlineEditor(): AffineInlineEditor {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  @property({ attribute: false })
  accessor frameModel!: FrameBlockModel;

  @property({ attribute: false })
  accessor left!: number;

  @property({ attribute: false })
  accessor maxWidth!: number;

  @query('rich-text')
  accessor richText!: RichText;

  @property({ attribute: false })
  accessor titleContentElement!: HTMLElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-card-title-editor': FrameCardTitleEditor;
  }
}
