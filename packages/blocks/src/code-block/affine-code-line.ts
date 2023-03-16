import { assertExists } from '@blocksuite/store';
import { VText } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Highlighter, Lang } from 'shiki';

import { NonShadowLitElement, queryCurrentMode } from '../std.js';

@customElement('affine-code-line')
export class AffineCodeLine extends NonShadowLitElement {
  @property({ type: Object })
  vText: VText = new VText();

  @property()
  getHighlightOptions:
    | (() => {
        lang: Lang;
        highlighter: Highlighter | null;
      })
    | null = null;

  render() {
    assertExists(this.getHighlightOptions, 'getHighlightOptions is not set');
    const { lang, highlighter } = this.getHighlightOptions();

    if (!highlighter || !highlighter.getLoadedLanguages().includes(lang)) {
      const vText = new VText();
      vText.str = this.vText.str;
      return html`<span>${vText}</span>`;
    }

    const mode = queryCurrentMode();

    const tokens = highlighter.codeToThemedTokens(
      this.vText.str,
      lang,
      mode === 'light' ? 'github-light' : 'github-dark'
    )[0];
    const vTexts = tokens.map(token => {
      const vText = new VText();
      vText.str = token.content;
      vText.styles = styleMap({
        color: token.color,
      });

      return vText;
    });

    return html`<span>${vTexts}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-line': AffineCodeLine;
  }
}
