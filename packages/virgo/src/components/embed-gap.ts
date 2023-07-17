import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';

export const EmbedGap = html`<span
  data-virgo-text-value=${ZERO_WIDTH_SPACE}
  data-virgo-embed-gap="true"
  data-virgo-text="true"
  style=${styleMap({
    userSelect: 'text',
    padding: '0 1px',
    outline: 'none',
  })}
  >${ZERO_WIDTH_SPACE}</span
>`;
