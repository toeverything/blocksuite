import '../affine-code-line.js';

import type { AttributesRenderer } from '@blocksuite/virgo';
import { html } from 'lit';
import type { Highlighter, Lang } from 'shiki';

export const getCodeLineRenderer: (
  getHighlightOptions: () => {
    lang: Lang;
    highlighter: Highlighter | null;
  }
) => AttributesRenderer = getHighlightOptions => (vText, _) => {
  return html`<affine-code-line
    .vText=${vText}
    .getHighlightOptions=${getHighlightOptions}
  ></affine-code-line>`;
};
