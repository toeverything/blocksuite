import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../../_common/components/rich-text/rich-text.js';
import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

export class FrameCardTitleEditor extends WithDisposable(ShadowlessElement) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frameModel!: FrameBlockModel;

  @property({ attribute: false })
  titleContentElement!: HTMLElement;

  @property({ attribute: false })
  left!: number;

  @property({ attribute: false })
  maxWidth!: number;

  private _isComposing = false;

  get vEditor() {
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
        this.titleContentElement.style.display = 'block';
      });

      this.disposables.addFromEvent(this.vEditorContainer, 'keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter' && !this._isComposing) {
          this._unmount();
          this.titleContentElement.style.display = 'block';
        }
      });
    });
  }

  private _unmount() {
    // dispose in advance to avoid execute `this.remove()` twice
    this.disposables.dispose();
    this.remove();
  }

  override render() {
    const virgoStyle = styleMap({
      transformOrigin: 'top left',
      borderRadius: '4px',
      maxWidth: `${this.maxWidth}px`,
      width: 'fit-content',
      height: '20px',
      fontSize: '12px',
      lineHeight: '20px',
      position: 'absolute',
      left: `${this.left}px`,
      top: '0px',
      minWidth: '8px',
      fontFamily: 'var(--affine-font-family)',
      background: 'var(--affine-white)',
      color: 'var(--affine-black)',
      outline: '1px solid var(--affine-blue-500)',
      zIndex: '1',
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
