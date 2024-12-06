import type { EditorHost } from '@blocksuite/block-std';

import { AIStarIcon } from '@blocksuite/affine-components/icons';
import { isGfxGroupCompatibleModel } from '@blocksuite/block-std/gfx';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { AIItemGroupConfig } from '../../../_common/components/ai-item/types.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { CopilotTool } from '../../edgeless/gfx-tool/copilot-tool.js';

import { sortEdgelessElements } from '../../edgeless/utils/clone-utils.js';

export class EdgelessCopilotToolbarEntry extends WithDisposable(LitElement) {
  static override styles = css`
    .copilot-icon-button {
      line-height: 20px;

      .label.medium {
        color: var(--affine-brand-color);
      }
    }
  `;

  private _onClick = () => {
    this.onClick?.();
    this._showCopilotPanel();
  };

  private _showCopilotPanel() {
    const selectedElements = sortEdgelessElements(
      this.edgeless.service.selection.selectedElements
    );
    const toBeSelected = new Set(selectedElements);

    selectedElements.forEach(element => {
      // its descendants are already selected
      if (toBeSelected.has(element)) return;

      toBeSelected.add(element);

      if (isGfxGroupCompatibleModel(element)) {
        element.descendantElements.forEach(descendant => {
          toBeSelected.add(descendant);
        });
      }
    });

    this.edgeless.gfx.tool.setTool('copilot');
    (
      this.edgeless.gfx.tool.currentTool$.peek() as CopilotTool
    ).updateSelectionWith(Array.from(toBeSelected), 10);
  }

  override render() {
    return html`<edgeless-tool-icon-button
      aria-label="Ask AI"
      class="copilot-icon-button"
      @click=${this._onClick}
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

  @property({ attribute: false })
  accessor onClick: (() => void) | undefined = undefined;
}
