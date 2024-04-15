import type { AffineAIPanelWidgetConfig } from '@blocksuite/blocks';
import { html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export const imageRenderer: AffineAIPanelWidgetConfig['answerRenderer'] = (
  answer,
  state
) => {
  if (state !== 'finished') {
    return nothing;
  }

  return html`<div
    class="chat-message-block"
    style=${styleMap({
      borderRadius: '4px',
      padding: '8px 12px',
      boxSizing: 'border-box',
      border: '1px solid var(--affine-border-color)',
      background: 'var(--affine-background-secondary-color)',
      position: 'relative',
      width: '100%',
      height: '100%',
      boxShadow: 'var(--affine-shadow-1)',
      overflow: 'hidden',
    })}
  >
    <img
      style=${styleMap({
        width: '100%',
        height: 'auto',
      })}
      src=${answer}
    />
  </div> `;
};
