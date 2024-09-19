import type { EditorHost } from '@blocksuite/block-std';

import { AIStarIcon } from '@blocksuite/affine-components/icons';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { CopilotSelectionController } from '../../edgeless/tools/copilot-tool.js';

import { getAllDescendantElements } from '../../edgeless/utils/tree.js';

export class EdgelessCopilotToolbarEntry extends WithDisposable(LitElement) {
  static override styles = css`
    .copilot-icon-button {
      line-height: 20px;

      .label.medium {
        color: var(--affine-brand-color);
      }
    }
  `;

  private _showCopilotPanel() {
    const selectedElements = this.edgeless.service.selection.selectedElements;
    const toBeSelected = new Set(selectedElements);
    selectedElements.forEach(element => {
      getAllDescendantElements(element).forEach(descendant => {
        toBeSelected.add(descendant);
      });
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

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor groups!: AIItemGroupConfig[];

  @property({ attribute: false })
  accessor host!: EditorHost;
}
