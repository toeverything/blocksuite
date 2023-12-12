import { assertExists } from '@blocksuite/global/utils';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { ShadowlessElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { IThemedToken } from 'shiki';

import type { AffineTextAttributes } from '../_common/components/rich-text/inline/types.js';
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
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  highlightOptionsGetter: HighlightOptionsGetter = null;

  override render() {
    assertExists(
      this.highlightOptionsGetter,
      'highlightOptionsGetter is not set'
    );
    const { lang, highlighter } = this.highlightOptionsGetter();

    if (!highlighter || !highlighter.getLoadedLanguages().includes(lang)) {
      return html`<span
        ><v-text
          .str=${this.delta.insert}
          .styles=${{
            'word-wrap': 'break-word',
          }}
        ></v-text
      ></span>`;
    }

    const mode = getThemeMode();
    const cacheKey: highlightCacheKey = `${this.delta.insert}-${lang}-${mode}`;
    const cache = highlightCache.get(cacheKey);

    let tokens: IThemedToken[] = [
      {
        content: this.delta.insert,
      },
    ];
    if (cache) {
      tokens = cache;
    } else {
      tokens = highlighter.codeToThemedTokens(
        this.delta.insert,
        lang,
        mode === 'dark' ? DARK_THEME : LIGHT_THEME
      )[0];
      highlightCache.set(cacheKey, tokens);
    }

    const vTexts = tokens.map(token => {
      return html`<v-text
        .str=${token.content}
        .styles=${{
          'word-wrap': 'break-word',
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
