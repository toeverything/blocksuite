import type {
  AffineInlineEditor,
  FrameBlockModel,
  RichText,
} from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export class FrameCardTitleEditor extends WithDisposable(ShadowlessElement) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  frameModel!: FrameBlockModel;

  @property({ attribute: false })
  titleContentElement!: HTMLElement;

  @property({ attribute: false })
  left!: number;

  @property({ attribute: false })
  maxWidth!: number;

  private _isComposing = false;

  get vEditor(): AffineInlineEditor {
    assertExists(this.richText.vEditor);
    return this.richText.vEditor;
  }

  get vEditorContainer() {
    return this.vEditor.rootElement;
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override firstUpdated(): void {
    this.updateComplete.then(() => {
      this.titleContentElement.style.display = 'none';

      this.vEditor.selectAll();

      this.vEditor.slots.updated.on(() => {
        this.requestUpdate();
      });

      this.disposables.addFromEvent(this.vEditorContainer, 'blur', () => {
        this._unmount();
      });
      this.disposables.addFromEvent(this.vEditorContainer, 'click', e => {
        e.stopPropagation();
      });
      this.disposables.addFromEvent(this.vEditorContainer, 'dblclick', e => {
        e.stopPropagation();
      });

      this.disposables.addFromEvent(this.vEditorContainer, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter' && !this._isComposing) {
          this._unmount();
        }
      });
    });
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.remove();
    this.titleContentElement.style.display = 'block';
  }

  override render() {
    const virgoStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '4px',
      maxWidth: `${this.maxWidth}px`,
      maxHeight: '20px',
      width: 'fit-content',
      height: '20px',
      fontSize: '12px',
      lineHeight: '20px',
      position: 'absolute',
      left: `${this.left}px`,
      top: '0px',
      minWidth: '8px',
      background: 'var(--affine-background-primary-color)',
      color: 'var(--affine-text-primary-color)',
      boxShadow: '0px 0px 0px 2px rgba(30, 150, 235, 0.30)',
      zIndex: '1',
      display: 'block',
      overflowY: 'hidden',
      overflowX: 'auto',
    });
    return html`<rich-text
      .yText=${this.frameModel.title.yText}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      .enableAutoScrollVertically=${false}
      style=${virgoStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-card-title-editor': FrameCardTitleEditor;
  }
}
