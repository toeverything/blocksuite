import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';
import type { ThemedToken } from 'shiki';

import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { HighlightOptionsGetter } from './utils/types.js';

import { DARK_THEME, LIGHT_THEME } from './utils/consts.js';
import {
  highlightCache,
  type highlightCacheKey,
} from './utils/highlight-cache.js';

@customElement('affine-code-line')
export class AffineCodeLine extends ShadowlessElement {
  override render() {
    assertExists(
      this.highlightOptionsGetter,
      'highlightOptionsGetter is not set'
    );
    const { lang, highlighter } = this.highlightOptionsGetter();

    if (!highlighter || !highlighter.getLoadedLanguages().includes(lang)) {
      return html`<span><v-text .str=${this.delta.insert}></v-text></span>`;
    }

    const mode = ThemeObserver.mode;
    const cacheKey: highlightCacheKey = `${this.delta.insert}-${lang}-${mode}`;
    const cache = highlightCache.get(cacheKey);

    let tokens: Omit<ThemedToken, 'offset'>[] = [
      {
        content: this.delta.insert,
      },
    ];
    if (cache) {
      tokens = cache;
    } else {
      tokens = highlighter.codeToTokensBase(this.delta.insert, {
        lang,
        theme: mode === 'dark' ? DARK_THEME : LIGHT_THEME,
      })[0];
      highlightCache.set(cacheKey, tokens);
    }

    const vTexts = tokens.map(token => {
      return html`<v-text
        .str=${token.content}
        style=${styleMap({
          color: token.color,
        })}
      ></v-text>`;
    });

    return html`<span>${vTexts}</span>`;
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  accessor highlightOptionsGetter: HighlightOptionsGetter | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-line': AffineCodeLine;
  }
}
