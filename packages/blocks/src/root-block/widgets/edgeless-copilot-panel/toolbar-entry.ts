import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import { AIStarIcon } from '../../../_common/icons/ai.js';
import { GroupLikeModel } from '../../../surface-block/element-model/base.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { isFrameBlock } from '../../edgeless/utils/query.js';

@customElement('edgeless-copilot-toolbar-entry')
export class EdgelessCopilotToolbarEntry extends WithDisposable(LitElement) {
  static override styles = css`
    .copilot-icon-button {
      color: var(--affine-brand-color);
      font-weight: 500;
      font-size: var(--affine-font-sm);
      position: relative;
    }

    .copilot-icon-button span {
      line-height: 22px;
      padding-left: 4px;
    }

    edgeless-copilot-panel {
      top: 44px;
      left: 0px;
      position: absolute;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  groups!: AIItemGroupConfig[];

  private _showCopilotPanel() {
    const selectedElements = this.edgeless.service.selection.elements;
    const toBeSelected = new Set(selectedElements);
    selectedElements.forEach(element => {
      if (isFrameBlock(element)) {
        this.edgeless.service.frame
          .getElementsInFrame(element)
          .forEach(ele => toBeSelected.add(ele));
      } else if (element instanceof GroupLikeModel) {
        element.decendants().forEach(ele => toBeSelected.add(ele));
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
    return html`
      <div class="copilot-button">
        <icon-button
          class="copilot-icon-button"
          width="75px"
          height="32px"
          @click=${this._showCopilotPanel}
        >
          ${AIStarIcon} <span>Ask AI</span>
        </icon-button>
      </div>
    `;
  }
}
