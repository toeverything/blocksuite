import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';
import { getInlineEditorInsideRoot } from '../utils/query.js';

@customElement('v-element')
export class VElement<
  T extends BaseTextAttributes = BaseTextAttributes,
> extends LitElement {
  override createRenderRoot() {
    return this;
  }

  override render() {
    const inlineEditor = getInlineEditorInsideRoot(this);
    const attributeRenderer = inlineEditor.attributeService.attributeRenderer;

    const isEmbed = inlineEditor.isEmbed(this.delta);
    if (isEmbed) {
      if (this.delta.insert.length !== 1) {
        throw new Error(`The length of embed node should only be 1.
          This seems to be an internal issue with inline editor.
          Please go to https://github.com/toeverything/blocksuite/issues
          to report it.`);
      }

      return html`<span
        data-v-embed="true"
        data-v-element="true"
        contenteditable="false"
        style=${styleMap({ userSelect: 'none' })}
        >${attributeRenderer(this.delta, this.selected)}</span
      >`;
    }

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-v-element="true"
      >${attributeRenderer(this.delta, this.selected)}</span
    >`;
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<T> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  accessor selected!: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'v-element': VElement;
  }
}
