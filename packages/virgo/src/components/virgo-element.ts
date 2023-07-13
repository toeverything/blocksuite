import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ZERO_WIDTH_SPACE } from '../consts.js';
import type { DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import type { VirgoRootElement } from '../virgo.js';

@customElement('v-element')
export class VirgoElement<
  T extends BaseTextAttributes = BaseTextAttributes
> extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<T> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  selected!: boolean;

  override render() {
    const rootElement = this.closest(
      '[data-virgo-root="true"]'
    ) as VirgoRootElement;
    assertExists(rootElement, 'v-element must be inside a v-root');
    const virgoEditor = rootElement.virgoEditor;
    assertExists(
      virgoEditor,
      'v-element must be inside a v-root with virgo-editor'
    );

    const attributeRenderer = virgoEditor.attributeService.attributeRenderer;

    const isEmbed = virgoEditor.isEmbed(this.delta);
    if (isEmbed) {
      if (this.delta.insert.length !== 1) {
        throw new Error(`The length of embed node should only be 1.
          This seems to be an internal issue with Virgo.
          Please go to https://github.com/toeverything/blocksuite/issues
          to report it.`);
      }

      return html`<span
        data-virgo-embed="true"
        data-virgo-element="true"
        contenteditable="false"
        style=${styleMap({ userSelect: 'none' })}
        >${attributeRenderer(this.delta, this.selected)}</span
      >`;
    }

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-virgo-element="true"
      >${attributeRenderer(this.delta, this.selected)}</span
    >`;
  }

  override createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-element': VirgoElement;
  }
}
