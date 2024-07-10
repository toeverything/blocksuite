import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import { AIStarIcon } from '../../../_common/icons/ai.js';
import { SurfaceGroupLikeModel } from '../../../surface-block/element-model/base.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { isFrameBlock } from '../../edgeless/utils/query.js';

@customElement('edgeless-copilot-toolbar-entry')
export class EdgelessCopilotToolbarEntry extends WithDisposable(LitElement) {
  static override styles = css`
    .copilot-icon-button {
      line-height: 20px;

      .label.medium {
        color: var(--affine-brand-color);
      }
    }
  `;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor groups!: AIItemGroupConfig[];

  private _showCopilotPanel() {
    const selectedElements = this.edgeless.service.selection.selectedElements;
    const toBeSelected = new Set(selectedElements);
    selectedElements.forEach(element => {
      if (isFrameBlock(element)) {
        this.edgeless.service.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeSelected.add(ele));
      } else if (element instanceof SurfaceGroupLikeModel) {
        element.descendants().forEach(ele => toBeSelected.add(ele));
      }
    });

    this.edgeless.service.tool.setEdgelessTool({
      type: 'copilot',
    });
    (
      this.edgeless.tools.controllers['copilot'] as CopilotSelectionController
    ).updateSelectionWith(Array.from(toBeSelected), 10);
  }

  override render() {
    return html`<edgeless-tool-icon-button
      aria-label="Ask AI"
      class="copilot-icon-button"
      @click=${this._showCopilotPanel}
    >
      ${AIStarIcon} <span class="label medium">Ask AI</span>
    </edgeless-tool-icon-button>`;
  }
}
