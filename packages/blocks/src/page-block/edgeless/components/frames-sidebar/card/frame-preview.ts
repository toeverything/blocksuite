import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

const styles = css`
  .frame-preview-container {
    display: flex;
    width: 100%;
    height: 100%;
  }

  .frame-preview-container canvas {
    width: 100%;
    height: 100%;
  }
`;
export class FramePreview extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  framePreview: HTMLCanvasElement | null = null;

  private _createScaledCanvas(canva: HTMLCanvasElement) {
    const scaledCanvas = document.createElement('canvas');

    const ctx = scaledCanvas.getContext('2d');
    assertExists(ctx);
    ctx.drawImage(canva, 0, 0, scaledCanvas.width, scaledCanvas.height);
    return scaledCanvas;
  }

  private _createFramePreview = () => {
    this.edgeless.clipboardController
      .toCanvas([this.frame], [])
      .then(canvas => {
        this.framePreview = this._createScaledCanvas(
          canvas ? canvas : document.createElement('canvas')
        );
      });
  };

  override firstUpdated() {
    this._createFramePreview();
  }

  override render() {
    return html`<div class="frame-preview-container">
      ${this.framePreview}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-preview': FramePreview;
  }
}
