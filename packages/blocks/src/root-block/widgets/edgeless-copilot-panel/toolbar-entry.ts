import { type EditorHost, WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import { AIStarIcon } from '../../../_common/icons/ai.js';
import { getElementsBound } from '../../../surface-block/index.js';
import type { CopilotSelectionController } from '../../edgeless/controllers/tools/copilot-tool.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

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
    this.edgeless.service.tool.setEdgelessTool({
      type: 'copilot',
    });
    const currentController = this.edgeless.tools.controllers[
      'copilot'
    ] as CopilotSelectionController;
    const selectedElements = this.edgeless.service.selection.elements;
    const selectedIds = selectedElements.map(e => e.id);
    this.edgeless.service.selection.clear();

    const padding = 10 / this.edgeless.service.zoom;
    const bounds = getElementsBound(
      selectedElements.map(e => e.elementBound)
    ).expand(padding);
    currentController.dragStartPoint = bounds.tl as [number, number];
    currentController.dragLastPoint = bounds.br as [number, number];
    this.edgeless.service.selection.set({
      elements: selectedIds,
      editing: false,
      inoperable: true,
    });
    currentController.draggingAreaUpdated.emit(true);
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
