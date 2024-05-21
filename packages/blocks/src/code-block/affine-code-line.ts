import { ShadowlessElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ThemedToken } from 'shiki';

import type { AffineTextAttributes } from '../_common/inline/presets/affine-inline-specs.js';
import { getThemeMode } from '../_common/utils/query.js';
import type { HighlightOptionsGetter } from './code-model.js';
import { DARK_THEME, LIGHT_THEME } from './utils/consts.js';
import {
  highlightCache,
  type highlightCacheKey,
} from './utils/highlight-cache.js';

@customElement('affine-code-line')
export class AffineCodeLine extends ShadowlessElement {
  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  accessor highlightOptionsGetter: HighlightOptionsGetter | null = null;

  override render() {
    assertExists(
      this.highlightOptionsGetter,
      'highlightOptionsGetter is not set'
    );
    const { lang, highlighter } = this.highlightOptionsGetter();

    if (!highlighter || !highlighter.getLoadedLanguages().includes(lang)) {
      return html`<span><v-text .str=${this.delta.insert}></v-text></span>`;
    }

    const mode = getThemeMode();
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
        .styles=${{
          color: token.color,
        }}
      ></v-text>`;
    });

    return html`<span>${vTexts}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-line': AffineCodeLine;
  }
}
