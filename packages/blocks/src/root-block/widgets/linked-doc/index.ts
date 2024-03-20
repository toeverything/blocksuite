import type { UIEventStateContext } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/block-std';
import {
  assertExists,
  DisposableGroup,
  throttle,
} from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { customElement } from 'lit/decorators.js';

import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import {
  getInlineEditorByModel,
  getViewportElement,
} from '../../../_common/utils/query.js';
import { getCurrentNativeRange } from '../../../_common/utils/selection.js';
import { getPopperPosition } from '../../../root-block/utils/position.js';
import { getMenus, type LinkedDocOptions } from './config.js';
import { LinkedDocPopover } from './linked-doc-popover.js';

export function showLinkedDocPopover({
  editorHost,
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
  options,
  triggerKey,
}: {
  editorHost: EditorHost;
  model: BlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
  options: LinkedDocOptions;
  triggerKey: string;
}) {
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const linkedDoc = new LinkedDocPopover(editorHost, model, abortController);
  linkedDoc.options = options;
  linkedDoc.triggerKey = triggerKey;
  // Mount
  container.append(linkedDoc);
  disposables.add(() => linkedDoc.remove());

  // Handle position
  const updatePosition = throttle(() => {
    const linkedDocElement = linkedDoc.linkedDocElement;
    assertExists(
      linkedDocElement,
      'You should render the linked doc node even if no position'
    );
    const position = getPopperPosition(linkedDocElement, range);
    linkedDoc.updatePosition(position);
  }, 10);
  disposables.addFromEvent(window, 'resize', updatePosition);
  const scrollContainer = getViewportElement(editorHost);
  if (scrollContainer) {
    // Note: in edgeless mode, the scroll container is not exist!
    disposables.addFromEvent(scrollContainer, 'scroll', updatePosition, {
      passive: true,
    });
  }

  // Wait for node to be mounted
  setTimeout(updatePosition);

  disposables.addFromEvent(window, 'mousedown', (e: Event) => {
    if (e.target === linkedDoc) return;
    abortController.abort();
  });

  return linkedDoc;
}

export const AFFINE_LINKED_DOC_WIDGET = 'affine-linked-doc-widget';

@customElement(AFFINE_LINKED_DOC_WIDGET)
export class AffineLinkedDocWidget extends WidgetElement {
  static DEFAULT_OPTIONS: LinkedDocOptions = {
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

  options = AffineLinkedDocWidget.DEFAULT_OPTIONS;

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
  }

  public showLinkedDoc = (model: BlockModel, triggerKey: string) => {
    const curRange = getCurrentNativeRange();
    showLinkedDocPopover({
      editorHost: this.host,
      model,
      range: curRange,
      options: this.options,
      triggerKey,
    });
  };

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
    const model = this.host.doc.getBlockById(text.blockId);
    if (!model) {
      return;
    }
    if (matchFlavours(model, this.options.ignoreBlockTypes)) return;
    const inlineEditor = getInlineEditorByModel(this.host, model);
    if (!inlineEditor) return;
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;
    if (inlineRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    const [leafStart, offsetStart] = inlineEditor.getTextPoint(
      inlineRange.index
    );
    const prefixText = leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';

    const matchedKey = this.options.triggerKeys.find(triggerKey =>
      (prefixText + event.key).endsWith(triggerKey)
    );
    if (!matchedKey) return;

    const primaryTriggerKey = this.options.triggerKeys[0];
    inlineEditor.slots.inlineRangeApply.once(() => {
      if (this.options.convertTriggerKey && primaryTriggerKey !== matchedKey) {
        // Convert to the primary trigger key
        // e.g. [[ -> @
        const startIdxBeforeMatchKey =
          inlineRange.index - (matchedKey.length - 1);
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
        inlineEditor.slots.inlineRangeApply.once(() => {
          this.showLinkedDoc(model, primaryTriggerKey);
        });
        return;
      }
      this.showLinkedDoc(model, matchedKey);
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_DOC_WIDGET]: AffineLinkedDocWidget;
  }
}
