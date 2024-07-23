import type { EditorHost, UIEventStateContext } from '@blocksuite/block-std';

import { WidgetComponent } from '@blocksuite/block-std';
import { DisposableGroup, throttle } from '@blocksuite/global/utils';
import { InlineEditor } from '@blocksuite/inline';
import { customElement } from 'lit/decorators.js';

import type { AffineInlineEditor } from '../../../_common/inline/presets/affine-inline-specs.js';

import { isControlledKeyboardEvent } from '../../../_common/utils/event.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import {
  getInlineEditorByModel,
  getViewportElement,
} from '../../../_common/utils/query.js';
import { getCurrentNativeRange } from '../../../_common/utils/selection.js';
import { getPopperPosition } from '../../../root-block/utils/position.js';
import { type LinkedMenuGroup, getMenus } from './config.js';
import { LinkedDocPopover } from './linked-doc-popover.js';

export const AFFINE_LINKED_DOC_WIDGET = 'affine-linked-doc-widget';

export interface LinkedWidgetConfig {
  /**
   * The first item of the trigger keys will be the primary key
   * e.g. @, [[
   */
  triggerKeys: [string, ...string[]];
  /**
   * Convert trigger key to primary key (the first item of the trigger keys)
   * [[ -> @
   */
  convertTriggerKey: boolean;
  ignoreBlockTypes: (keyof BlockSuite.BlockModels)[];
  getMenus: (
    query: string,
    abort: () => void,
    editorHost: EditorHost,
    inlineEditor: AffineInlineEditor
  ) => Promise<LinkedMenuGroup[]>;
}

@customElement(AFFINE_LINKED_DOC_WIDGET)
export class AffineLinkedDocWidget extends WidgetComponent {
  private _onKeyDown = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;
    // FIXME: Event can be undefined sometimes for unknown reason
    // Need to investigate
    // Maybe related to the lifecycle of the widget
    if (!event || isControlledKeyboardEvent(event) || event.key.length !== 1)
      return;
    const inlineEditor = this.getInlineEditor(event);
    if (!inlineEditor) return;
    const inlineRange = inlineEditor.getInlineRange();
    if (!inlineRange) return;
    if (inlineRange.length > 0) {
      // When select text and press `[[` should not trigger transform,
      // since it will break the bracket complete.
      // Expected `[[selected text]]` instead of `@selected text]]`
      return;
    }

    const textPoint = inlineEditor.getTextPoint(inlineRange.index);
    if (!textPoint) return;
    const [leafStart, offsetStart] = textPoint;
    const prefixText = leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';

    const matchedKey = this.config.triggerKeys.find(triggerKey =>
      (prefixText + event.key).endsWith(triggerKey)
    );
    if (!matchedKey) return;

    const primaryTriggerKey = this.config.triggerKeys[0];
    inlineEditor.slots.inlineRangeApply.once(() => {
      if (this.config.convertTriggerKey && primaryTriggerKey !== matchedKey) {
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
          this.showLinkedDocPopover(inlineEditor, primaryTriggerKey);
        });
        return;
      }
      this.showLinkedDocPopover(inlineEditor, matchedKey);
    });
  };

  private getInlineEditor = (evt: KeyboardEvent) => {
    if (evt.target instanceof HTMLElement) {
      const editor = (
        evt.target.closest('.can-link-doc > .inline-editor') as {
          inlineEditor?: AffineInlineEditor;
        }
      )?.inlineEditor;
      if (editor instanceof InlineEditor) {
        return editor;
      }
    }

    const text = this.host.selection.value.find(selection =>
      selection.is('text')
    );
    if (!text) return;

    const model = this.host.doc.getBlockById(text.blockId);
    if (!model) return;

    if (matchFlavours(model, this.config.ignoreBlockTypes)) {
      return;
    }

    return getInlineEditorByModel(this.host, model);
  };

  showLinkedDocPopover = (
    inlineEditor: AffineInlineEditor,
    triggerKey: string
  ) => {
    const curRange = getCurrentNativeRange();
    if (!curRange) return;

    const abortController = new AbortController();
    const disposables = new DisposableGroup();
    abortController.signal.addEventListener('abort', () =>
      disposables.dispose()
    );

    const linkedDoc = new LinkedDocPopover(
      triggerKey,
      this.config.getMenus,
      this.host,
      inlineEditor,
      abortController
    );

    // Mount
    document.body.append(linkedDoc);
    disposables.add(() => linkedDoc.remove());

    // Handle position
    const updatePosition = throttle(() => {
      const linkedDocElement = linkedDoc.linkedDocElement;
      if (!linkedDocElement) return;
      const position = getPopperPosition(linkedDocElement, curRange);
      linkedDoc.updatePosition(position);
    }, 10);
    disposables.addFromEvent(window, 'resize', updatePosition);
    const scrollContainer = getViewportElement(this.host);
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
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
  }

  get config(): LinkedWidgetConfig {
    return {
      triggerKeys: ['@', '[[', '【【'],
      ignoreBlockTypes: ['affine:code'],
      convertTriggerKey: true,
      getMenus,
      ...this.std.spec.getConfig(this.flavour)?.linkedWidget,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_LINKED_DOC_WIDGET]: AffineLinkedDocWidget;
  }
}
