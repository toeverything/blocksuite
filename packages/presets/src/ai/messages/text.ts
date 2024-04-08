import type { AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import { html } from 'lit';

export const textRenderer: AffineAIPanelWidgetConfig['answerRenderer'] =
  answer =>
    html`<div>${answer.split('\n').map(text => html`<p>${text}</p>`)}</div>`;
