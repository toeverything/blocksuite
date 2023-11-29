import { html } from 'lit';
import { createRef, ref, type RefOrCallback } from 'lit/directives/ref.js';

import { CopyIcon } from '../_common/icons/index.js';
import { stopPropagation } from '../_common/utils/event.js';
import type { HtmlBlockModel } from './html-model.js';
import { styles } from './styles.js';

export function HtmlBlockOptionsTemplate({
  anchor,
  model,
  abortController,
  ref: refOrCallback = createRef<HTMLDivElement>(),
}: {
  anchor: HTMLElement;
  model: HtmlBlockModel;
  abortController: AbortController;
  ref?: RefOrCallback;
}) {
  let containerEl: Element | undefined;
  const refCallback = (el: Element | undefined) => {
    containerEl = el;

    if (!refCallback) return;
    // See also https://github.com/lit/lit/blob/c134604f178e36444261d83eabe9e578c1ed90c4/packages/lit-html/src/directives/ref.ts
    typeof refOrCallback === 'function'
      ? refOrCallback(el)
      : ((
          refOrCallback as {
            // RefInternal
            value: Element | undefined;
          }
        ).value = el);
  };

  const readonly = model.page.readonly;
  const moreMenuAbortController: AbortController | null = null;
  return html` <style>
      ${styles}
    </style>

    <div
      ${ref(refCallback)}
      class="affine-html-options"
      @pointerdown="${stopPropagation}"
    >
      <icon-button size="32px" ?hidden="${true}">
        ${CopyIcon}
        <affine-tooltip .offset="${12}">Copy HTML Code</affine-tooltip>
      </icon-button>
    </div>`;
}
