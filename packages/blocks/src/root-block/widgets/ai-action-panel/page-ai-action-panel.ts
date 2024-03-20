import './components/index.js';

import { WidgetElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import type { AiActionPanelBase } from './components/index.js';

export const AFFINE_PAGE_AI_ACTION_PANEL_WIDGET =
  'affine-page-ai-action-panel-widget';

@customElement(AFFINE_PAGE_AI_ACTION_PANEL_WIDGET)
export class AffinePageAIActionPanelWidget extends WidgetElement {
  @query('ai-action-panel-base')
  actionPanel!: AiActionPanelBase;
  get actionPanelSlots() {
    return this.actionPanel.slots;
  }

  private _answer = '';

  override firstUpdated() {
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    this.disposables.add(
      this.actionPanelSlots.stateChange.on(({ type, input }) => {
        if (type === 'generating') {
          this._answer = '';
          intervalId = setInterval(() => {
            this._answer += input;
            this.requestUpdate();
          }, 1000);
          timeoutId = setTimeout(() => {
            // this.actionPanel.state = {
            //   type: 'finished',
            //   input,
            // };
            this.actionPanel.state = {
              type: 'error',
              input,
            };
          }, 6000);
        } else if (type === 'finished' || type === 'error') {
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
        }
      })
    );
  }

  override render() {
    return html`<ai-action-panel-base>
      <ai-basic-answer
        .answer=${this._answer}
        slot="generating"
      ></ai-basic-answer>
      <ai-basic-answer
        .answer=${this._answer}
        slot="finished"
      ></ai-basic-answer>
      <ai-basic-action slot="finished"></ai-basic-action>
    </ai-action-panel-base>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_PAGE_AI_ACTION_PANEL_WIDGET]: AffinePageAIActionPanelWidget;
  }
}
