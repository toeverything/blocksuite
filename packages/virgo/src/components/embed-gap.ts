import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';

export const EmbedGap = html`<span
  data-v-text-value=${ZERO_WIDTH_SPACE}
  data-v-embed-gap="true"
  data-v-text="true"
  style=${styleMap({
    userSelect: 'text',
    padding: '0 0.5px',
    outline: 'none',
  })}
  >${ZERO_WIDTH_SPACE}</span
>`;
