import './components/lang-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { offset } from '@floating-ui/dom';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

import {
  createLitPortal,
  whenHover,
} from '../../../_common/components/index.js';
import type { CodeBlockModel } from '../../../code-block/code-model.js';
import type { CodeBlockComponent } from '../../../code-block/index.js';

export const AFFINE_CODE_LANGUAGE_LIST_WIDGET =
  'affine-code-language-list-widget';

@customElement(AFFINE_CODE_LANGUAGE_LIST_WIDGET)
export class AffineCodeLanguageListWidget extends WidgetElement<
  CodeBlockModel,
  CodeBlockComponent
> {
  override connectedCallback() {
    super.connectedCallback();

    let isActivated = false;
    let abortController: AbortController | null = null;
    const { setFloating, setReference } = whenHover(isHover => {
      if (!isHover) {
        // If the language list is opened, don't close it.
        if (isActivated) return;
        abortController?.abort();
        return;
      }
      if (abortController) return;
      abortController = new AbortController();
      abortController.signal.addEventListener('abort', () => {
        abortController = null;
      });

      createLitPortal({
        closeOnClickAway: true,
        abortController,
        template: html`<language-list-button
          ${ref(setFloating)}
          .blockElement=${this.blockElement}
          .onChange=${(active: boolean) => {
            isActivated = active;
          }}
        >
        </language-list-button>`,
        computePosition: {
          referenceElement: this.blockElement,
          placement: 'left-start',
          middleware: [offset({ mainAxis: -5, crossAxis: 5 })],
          autoUpdate: true,
        },
      });
    });
    setReference(this.blockElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_CODE_LANGUAGE_LIST_WIDGET]: AffineCodeLanguageListWidget;
  }
}
