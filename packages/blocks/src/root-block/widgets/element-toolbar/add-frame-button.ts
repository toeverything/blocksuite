import { FrameIcon } from '@blocksuite/affine-components/icons';
import { WithDisposable } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

import { MindmapElementModel } from '../../../surface-block/index.js';

@customElement('edgeless-add-frame-button')
export class EdgelessAddFrameButton extends WithDisposable(LitElement) {
  private _createFrame = () => {
    const frame = this.edgeless.service.frame.createFrameOnSelected();
    if (!frame) return;
    this.edgeless.service.telemetryService?.track('CanvasElementAdded', {
      control: 'context-menu',
      page: 'whiteboard editor',
      module: 'toolbar',
      segment: 'toolbar',
      type: 'frame',
    });
    this.edgeless.surface.fitToViewport(Bound.deserialize(frame.xywh));
  };

  static override styles = css`
    .label {
      padding-left: 4px;
    }
  `;

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
