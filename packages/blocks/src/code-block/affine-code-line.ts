import { assertExists } from '@blocksuite/store';
import { VText } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Highlighter, IThemedToken, Lang } from 'shiki';

import { NonShadowLitElement, queryCurrentMode } from '../std.js';
import {
  highlightCache,
  type highlightCacheKey,
} from './utils/highlight-cache.js';

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
    const cacheKey: highlightCacheKey = `${this.vText.str}-${lang}-${mode}`;
    const cache = highlightCache.get(cacheKey);

    let tokens: IThemedToken[] = [
      {
        content: this.vText.str,
      },
    ];
    if (cache) {
      tokens = cache;
    } else {
      tokens = highlighter.codeToThemedTokens(
        this.vText.str,
        lang,
        mode === 'dark' ? 'github-dark' : 'github-light'
      )[0];
      highlightCache.set(cacheKey, tokens);
    }

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
