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
    this.disposables.add(
      this.actionPanelSlots.stateChange.on(({ type, input }) => {
        let id: NodeJS.Timeout | null = null;
        if (type === 'generating') {
          this._answer = '';
          id = setInterval(() => {
            this._answer += input;
            this.requestUpdate();
          }, 1000);
          setTimeout(() => {
            if (id) clearInterval(id);
            // this.actionPanel.state = {
            //   type: 'finished',
            //   input,
            // };
            this.actionPanel.state = {
              type: 'error',
              input,
            };
          }, 6000);
        } else if (type === 'finished') {
          if (id) clearInterval(id);
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
