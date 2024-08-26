import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { LitElement, html, nothing } from 'lit';
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
    if (!inlineEditor) {
      return nothing;
    }
    const attributeRenderer = inlineEditor.attributeService.attributeRenderer;
    const renderProps: Parameters<typeof attributeRenderer>[0] = {
      delta: this.delta,
      selected: this.selected,
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      lineIndex: this.lineIndex,
    };

    const isEmbed = inlineEditor.isEmbed(this.delta);
    if (isEmbed) {
      if (this.delta.insert.length !== 1) {
        throw new BlockSuiteError(
          ErrorCode.InlineEditorError,
          `The length of embed node should only be 1.
          This seems to be an internal issue with inline editor.
          Please go to https://github.com/toeverything/blocksuite/issues
          to report it.`
        );
      }

      return html`<span
        data-v-embed="true"
        data-v-element="true"
        contenteditable="false"
        style=${styleMap({ userSelect: 'none' })}
        >${attributeRenderer(renderProps)}</span
      >`;
    }

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-v-element="true"
      >${attributeRenderer(renderProps)}</span
    >`;
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<T> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ attribute: false })
  accessor endOffset!: number;

  @property({ attribute: false })
  accessor lineIndex!: number;

  @property({ attribute: false })
  accessor selected: boolean = false;

  @property({ attribute: false })
  accessor startOffset!: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'v-element': VElement;
  }
}
