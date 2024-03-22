import './components/index.js';

import { WidgetElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { AssistantHistoryItem } from '../../../_common/copilot/model/chat-history.js';
import { createCommonTextAction } from '../../../_common/copilot/model/message-type/text/actions.js';

export const AFFINE_PAGE_AI_ACTION_PANEL_WIDGET =
  'affine-page-ai-action-panel-widget';

@customElement(AFFINE_PAGE_AI_ACTION_PANEL_WIDGET)
export class AffinePageAIActionPanelWidget extends WidgetElement {
  static override styles = css`
    .root {
      display: flex;
      padding: 12px 12px;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      align-self: stretch;

      border-radius: var(--8, 8px);
      border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
      background: var(--light-background-backgroundOverlayPanelColor, #fbfbfc);

      /* light/toolbarShadow */
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
    }
  `;

  get copilot() {
    return this.host.std.spec.getService('affine:page').copilot;
  }

  @state()
  item?: AssistantHistoryItem;

  private _inputFinish = (input: string) => {
    this.item = this.copilot.askAI(createCommonTextAction(input), input);
  };

  override render() {
    if (this.item) {
      return html`<div class="root">${this.item.render(this.host)}</div>`;
    }
    return html`<ai-action-bar-input
      .onFinish=${this._inputFinish}
    ></ai-action-bar-input>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PAGE_AI_ACTION_PANEL_WIDGET]: AffinePageAIActionPanelWidget;
  }
}
