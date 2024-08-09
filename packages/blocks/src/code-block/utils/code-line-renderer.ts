import type { AttributeRenderer } from '@blocksuite/inline';

import { html } from 'lit';

import type { HighlightOptionsGetter } from './types.js';

export const getCodeLineRenderer: (
  highlightOptionsGetter: HighlightOptionsGetter
) => AttributeRenderer = highlightOptionsGetter => delta => {
  return html`<affine-code-line
    .delta=${delta}
    .highlightOptionsGetter=${highlightOptionsGetter}
  ></affine-code-line>`;
};
