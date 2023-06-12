import { assertExists } from '@blocksuite/global/utils';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-virgo-element="true"
      >${attributeRenderer(this.delta)}</span
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
