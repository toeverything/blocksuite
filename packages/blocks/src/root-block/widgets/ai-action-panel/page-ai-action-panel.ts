import './components/index.js';

import { WidgetElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

export const AFFINE_PAGE_AI_ACTION_PANEL_WIDGET =
  'affine-page-ai-action-panel-widget';

@customElement(AFFINE_PAGE_AI_ACTION_PANEL_WIDGET)
export class AffinePageAIActionPanelWidget extends WidgetElement {
  get copilot() {
    return this.host.std.spec.getService('affine:page').copilot;
  }

  override render() {
    return html`<ai-action-panel-base
      .copilot="${this.copilot}"
      .host="${this.host}"
    >
    </ai-action-panel-base>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PAGE_AI_ACTION_PANEL_WIDGET]: AffinePageAIActionPanelWidget;
  }
}
