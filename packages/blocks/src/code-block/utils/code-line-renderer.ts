import type { AttributesRenderer } from '@blocksuite/virgo';
import { html } from 'lit';
import type { Highlighter, Lang } from 'shiki';

export const getCodeLineRenderer: (
  getHighlightOptions: () => {
    lang: Lang;
    highlighter: Highlighter | null;
  }
) => AttributesRenderer = getHighlightOptions => delta => {
  return html`<affine-code-line
    .delta=${delta}
    .getHighlightOptions=${getHighlightOptions}
  ></affine-code-line>`;
};
