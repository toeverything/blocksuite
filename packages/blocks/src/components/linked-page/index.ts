import type { UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  DisposableGroup,
  matchFlavours,
} from '@blocksuite/store';
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  isControlledKeyboardEvent,
  throttle,
} from '../../__internal__/utils/common.js';
import {
  getModelByElement,
  getViewportElement,
  getVirgoByModel,
} from '../../__internal__/utils/query.js';
import { getCurrentNativeRange } from '../../__internal__/utils/selection.js';
import { getPopperPosition } from '../../page-block/utils/position.js';
import { getMenus, type LinkedPageOptions } from './config.js';
import { LinkedPagePopover } from './linked-page-popover.js';

export function showLinkedPagePopover({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
  options,
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
  options: LinkedPageOptions;
}) {
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const linkedPage = new LinkedPagePopover(model, abortController);
  linkedPage.options = options;
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

@customElement('affine-linked-page-widget')
export class LinkedPageWidget extends WithDisposable(LitElement) {
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

  options = LinkedPageWidget.DEFAULT_OPTIONS;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.root.uiEventDispatcher.add('keyDown', this._onKeyDown)
    );
  }

  public showLinkedPage(model: BaseBlockModel) {
    const curRange = getCurrentNativeRange();
    showLinkedPagePopover({ model, range: curRange, options: this.options });
  }

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const flag = this.root.page.awarenessStore.getFlag('enable_linked_page');
    if (!flag) return;
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;
    if (isControlledKeyboardEvent(event) || event.key.length !== 1) return;

    // Fixme @Saul-Mirone get model from getCurrentSelection
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) return;
    const model = getModelByElement(target);

    if (matchFlavours(model, this.options.ignoreBlockTypes)) return;
    const vEditor = getVirgoByModel(model);
    if (!vEditor) return;
    const vRange = vEditor.getVRange();
    if (!vRange) return;
    if (vRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    const [leafStart, offsetStart] = vEditor.getTextPoint(vRange.index);
    const prefixText = leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';

    const matchedKey = this.options.triggerKeys.find(triggerKey =>
      (prefixText + event.key).endsWith(triggerKey)
    );
    if (!matchedKey) return;

    const primaryTriggerKey = this.options.triggerKeys[0];
    vEditor.slots.rangeUpdated.once(() => {
      if (this.options.convertTriggerKey && primaryTriggerKey !== matchedKey) {
        // Convert to the primary trigger key
        // e.g. [[ -> @
        const startIdxBeforeMatchKey = vRange.index - (matchedKey.length - 1);
        vEditor.deleteText({
          index: startIdxBeforeMatchKey,
          length: matchedKey.length,
        });
        vEditor.insertText(
          { index: startIdxBeforeMatchKey, length: 0 },
          primaryTriggerKey
        );
        vEditor.setVRange({
          index: startIdxBeforeMatchKey + primaryTriggerKey.length,
          length: 0,
        });
        vEditor.slots.rangeUpdated.once(() => {
          this.showLinkedPage(model);
        });
        return;
      }
      this.showLinkedPage(model);
    });
  };
}
