import type { UIEventStateContext } from '@blocksuite/block-std';
import {
  assertExists,
  DisposableGroup,
  throttle,
} from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import { customElement } from 'lit/decorators.js';

import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import {
  getInlineEditorByModel,
  getViewportElement,
} from '../../../_common/utils/query.js';
import { getCurrentNativeRange } from '../../../_common/utils/selection.js';
import { getPopperPosition } from '../../../page-block/utils/position.js';
import { getMenus, type LinkedPageOptions } from './config.js';
import { LinkedPagePopover } from './linked-page-popover.js';

export function showLinkedPagePopover({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
  options,
  triggerKey,
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
  options: LinkedPageOptions;
  triggerKey: string;
}) {
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const linkedPage = new LinkedPagePopover(model, abortController);
  linkedPage.options = options;
  linkedPage.triggerKey = triggerKey;
  // Mount
  container.appendChild(linkedPage);
  disposables.add(() => linkedPage.remove());

  // Handle position
  const updatePosition = throttle(() => {
    const linkedPageElement = linkedPage.linkedPageElement;
    assertExists(
      linkedPageElement,
      'You should render the linked page node even if no position'
    );
    const position = getPopperPosition(linkedPageElement, range);
    linkedPage.updatePosition(position);
  }, 10);
  disposables.addFromEvent(window, 'resize', updatePosition);
  const scrollContainer = getViewportElement(model.page);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    disposables.addFromEvent(scrollContainer, 'scroll', updatePosition, {
      passive: true,
    });
  }

  // Wait for node to be mounted
  setTimeout(updatePosition);

  disposables.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === linkedPage) return;
    abortController.abort();
  });

  return linkedPage;
}

export const AFFINE_LINKED_PAGE_WIDGET = 'affine-linked-page-widget';

@customElement(AFFINE_LINKED_PAGE_WIDGET)
export class AffineLinkedPageWidget extends WidgetElement {
  static DEFAULT_OPTIONS: LinkedPageOptions = {
    /**
     * The first item of the trigger keys will be the primary key
     */
    triggerKeys: ['@', '[[', '【【'],
    ignoreBlockTypes: ['affine:code'],
    /**
     * Convert trigger key to primary key (the first item of the trigger keys)
     */
    convertTriggerKey: true,
    getMenus,
  };

  options = AffineLinkedPageWidget.DEFAULT_OPTIONS;

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
  }

  public showLinkedPage(model: BaseBlockModel, triggerKey: string) {
    const curRange = getCurrentNativeRange();
    showLinkedPagePopover({
      model,
      range: curRange,
      options: this.options,
      triggerKey,
    });
  }

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;
    if (isControlledKeyboardEvent(event) || event.key.length !== 1) return;
    const text = this.host.selection.value.find(selection =>
      selection.is('text')
    );
    if (!text) {
      return;
    }
    const model = this.host.page.getBlockById(text.blockId);
    if (!model) {
      return;
    }
    if (matchFlavours(model, this.options.ignoreBlockTypes)) return;
    const inlineEditor = getInlineEditorByModel(model);
    if (!inlineEditor) return;
    const vRange = inlineEditor.getInlineRange();
    if (!vRange) return;
    if (vRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    const [leafStart, offsetStart] = inlineEditor.getTextPoint(vRange.index);
    const prefixText = leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';

    const matchedKey = this.options.triggerKeys.find(triggerKey =>
      (prefixText + event.key).endsWith(triggerKey)
    );
    if (!matchedKey) return;

    const primaryTriggerKey = this.options.triggerKeys[0];
    inlineEditor.slots.rangeUpdated.once(() => {
      if (this.options.convertTriggerKey && primaryTriggerKey !== matchedKey) {
        // Convert to the primary trigger key
        // e.g. [[ -> @
        const startIdxBeforeMatchKey = vRange.index - (matchedKey.length - 1);
        inlineEditor.deleteText({
          index: startIdxBeforeMatchKey,
          length: matchedKey.length,
        });
        inlineEditor.insertText(
          { index: startIdxBeforeMatchKey, length: 0 },
          primaryTriggerKey
        );
        inlineEditor.setInlineRange({
          index: startIdxBeforeMatchKey + primaryTriggerKey.length,
          length: 0,
        });
        inlineEditor.slots.rangeUpdated.once(() => {
          this.showLinkedPage(model, primaryTriggerKey);
        });
        return;
      }
      this.showLinkedPage(model, matchedKey);
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_PAGE_WIDGET]: AffineLinkedPageWidget;
  }
}
