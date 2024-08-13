import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';
import type { ThemedToken } from 'shiki';

import { ShadowlessElement } from '@blocksuite/block-std';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('affine-code-unit')
export class AffineCodeUnit extends ShadowlessElement {
  override render() {
    const plainContent = html`<span
      ><v-text .str=${this.delta.insert}></v-text
    ></span>`;

    const codeBlock = this.codeBlock;
    const vElement = this.vElement;
    if (!codeBlock || !vElement) return plainContent;
    const tokens = codeBlock.highlightTokens$.value;
    if (tokens.length === 0) return plainContent;
    // copy the tokens to avoid modifying the original tokens
    const lineTokens = structuredClone(tokens[vElement.lineIndex]);
    if (lineTokens.length === 0) return plainContent;

    const startOffset = vElement.startOffset;
    const endOffset = vElement.endOffset;
    const includedTokens: ThemedToken[] = [];
    lineTokens.forEach(token => {
      if (
        (token.offset <= startOffset &&
          token.offset + token.content.length >= startOffset) ||
        (token.offset >= startOffset &&
          token.offset + token.content.length <= endOffset) ||
        (token.offset <= endOffset &&
          token.offset + token.content.length >= endOffset)
      ) {
        includedTokens.push(token);
      }
    });
    if (includedTokens.length === 0) return plainContent;

    // trim off the excess part at the beginning
    includedTokens[0].content = includedTokens[0].content.slice(
      startOffset - includedTokens[0].offset
    );
    // trim off the excess part at the end
    includedTokens[includedTokens.length - 1].content = includedTokens[
      includedTokens.length - 1
    ].content.slice(
      0,
      endOffset - includedTokens[includedTokens.length - 1].offset
    );

    const vTexts = includedTokens.map(token => {
      return html`<v-text
        .str=${token.content}
        style=${styleMap({
          color: token.color,
        })}
      ></v-text>`;
    });

    return html`<span>${vTexts}</span>`;
  }

  get codeBlock() {
    return this.closest('affine-code');
  }

  get vElement() {
    return this.closest('v-element');
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-unit': AffineCodeUnit;
  }
}
