import type { AttributeRenderer } from '@blocksuite/inline';
import { html } from 'lit';
import type { Highlighter, Lang } from 'shiki';

export const getCodeLineRenderer: (
  highlightOptionsGetter: () => {
    lang: Lang;
    highlighter: Highlighter | null;
  }
) => AttributeRenderer = highlightOptionsGetter => delta => {
  return html`<affine-code-line
    .delta=${delta}
    .highlightOptionsGetter=${highlightOptionsGetter}
  ></affine-code-line>`;
};
