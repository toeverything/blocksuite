import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export const EmbedGap = html`<span
  data-v-embed-gap="true"
  style=${styleMap({
    outline: 'none',
    padding: '0 0.5px',
    userSelect: 'text',
  })}
  ><v-text></v-text
></span>`;
