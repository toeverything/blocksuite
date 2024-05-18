import '../../edgeless/components/buttons/tool-icon-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { FrameIcon } from '../../../_common/icons/index.js';
import { Bound, MindmapElementModel } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessModel } from '../../edgeless/type.js';

@customElement('edgeless-add-frame-button')
export class EdgelessAddFrameButton extends WithDisposable(LitElement) {
  static override styles = css`
    .label {
      padding-left: 4px;
    }
  `;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  protected override render() {
    return html`<edgeless-tool-icon-button
      aria-label="Frame"
      .tooltip=${'Frame'}
      .labelHeight=${'20px'}
      @click=${() => {
        const frame = this.edgeless.service.frame.createFrameOnSelected();
        this.edgeless.surface.fitToViewport(Bound.deserialize(frame.xywh));
      }}
    >
      ${FrameIcon}<span class="label medium">Frame</span>
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-add-frame-button': EdgelessAddFrameButton;
  }
}

export function renderAddFrameButton(
  edgeless: EdgelessRootBlockComponent,
  elements: EdgelessModel[]
) {
  if (elements.length < 2) return nothing;
  if (elements.some(e => e.group instanceof MindmapElementModel))
    return nothing;

  return html`<edgeless-add-frame-button
    .edgeless=${edgeless}
  ></edgeless-add-frame-button>`;
}
