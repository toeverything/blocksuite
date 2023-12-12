import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { INLINE_ROOT_ATTR, ZERO_WIDTH_SPACE } from '../consts.js';
import type { InlineRootElement } from '../inline-editor.js';
import type { DeltaInsert } from '../types.js';
import { EmbedGap } from './embed-gap.js';

@customElement('v-line')
export class VLine extends LitElement {
  @property({ attribute: false })
  elements: [TemplateResult<1>, DeltaInsert][] = [];

  get vElements() {
    return Array.from(this.querySelectorAll('v-element'));
  }

  get vTexts() {
    return Array.from(this.querySelectorAll('v-text'));
  }

  get textLength() {
    return this.vElements.reduce((acc, el) => acc + el.delta.insert.length, 0);
  }

  override get textContent() {
    return this.vElements.reduce((acc, el) => acc + el.delta.insert, '');
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await Promise.all(this.vElements.map(el => el.updateComplete));
    await Promise.all(this.vTexts.map(el => el.updateComplete));
    return result;
  }

  protected override firstUpdated(): void {
    this.style.display = 'block';
  }

  override render() {
    if (this.elements.length === 0) {
      return html`<div><v-text .str=${ZERO_WIDTH_SPACE}></v-text></div>`;
    }

    if (!this.isConnected) return;

    const rootElement = this.closest(
      `[${INLINE_ROOT_ATTR}]`
    ) as InlineRootElement;
    assertExists(rootElement, 'v-line must be inside a v-root');
    const inlineEditor = rootElement.inlineEditor;
    assertExists(
      inlineEditor,
      'v-line must be inside a v-root with inline-editor'
    );

    const renderElements = this.elements.flatMap(([template, delta], index) => {
      if (inlineEditor.isEmbed(delta)) {
        if (delta.insert.length !== 1) {
          throw new Error(`The length of embed node should only be 1.
            This seems to be an internal issue with inline editor.
            Please go to https://github.com/toeverything/blocksuite/issues
            to report it.`);
        }
        // we add `EmbedGap` to make cursor can be placed between embed elements
        if (index === 0) {
          const nextDelta = this.elements[index + 1]?.[1];
          if (!nextDelta || inlineEditor.isEmbed(nextDelta)) {
            return [EmbedGap, template, EmbedGap];
          } else {
            return [EmbedGap, template];
          }
        } else {
          const nextDelta = this.elements[index + 1]?.[1];
          if (!nextDelta || inlineEditor.isEmbed(nextDelta)) {
            return [template, EmbedGap];
          } else {
            return [template];
          }
        }
      }
      return template;
    });

    // prettier will generate \n and cause unexpected space and line break
    // prettier-ignore
    return html`<div style=${styleMap({
      // this padding is used to make cursor can be placed at the
      // start and end of the line when the first and last element is embed element
      padding: '0 0.5px',
    })}>${renderElements}</div>`;
  }

  override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-line': VLine;
  }
}
