import { FrameIcon } from '@blocksuite/affine-components/icons';
import { MindmapElementModel } from '@blocksuite/affine-model';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { Bound, WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

export class EdgelessAddFrameButton extends WithDisposable(LitElement) {
  static override styles = css`
    .label {
      padding-left: 4px;
    }
  `;

  private _createFrame = () => {
    const frame = this.edgeless.service.frame.createFrameOnSelected();
    if (!frame) return;
    this.edgeless.std
      .getOptional(TelemetryProvider)
      ?.track('CanvasElementAdded', {
        control: 'context-menu',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'frame',
      });
    this.edgeless.surface.fitToViewport(Bound.deserialize(frame.xywh));
  };

  protected override render() {
    return html`
      <editor-icon-button
        aria-label="Frame"
        .tooltip=${'Frame'}
        .labelHeight=${'20px'}
        @click=${this._createFrame}
      >
        ${FrameIcon}<span class="label medium">Frame</span>
      </editor-icon-button>
    `;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-frame-button': EdgelessAddFrameButton;
  }
}

export function renderAddFrameButton(
  edgeless: EdgelessRootBlockComponent,
  elements: BlockSuite.EdgelessModel[]
) {
  if (elements.length < 2) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`
    <edgeless-add-frame-button
      .edgeless=${edgeless}
    ></edgeless-add-frame-button>
  `;
}
