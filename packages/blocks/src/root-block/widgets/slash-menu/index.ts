import type { UIEventStateContext } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/block-std';
import {
  assertExists,
  DisposableGroup,
  throttle,
} from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';
import { customElement } from 'lit/decorators.js';

import {
  getCurrentNativeRange,
  getInlineEditorByModel,
  isControlledKeyboardEvent,
  matchFlavours,
} from '../../../_common/utils/index.js';
import type { RootBlockComponent } from '../../../root-block/types.js';
import { isRootElement } from '../../../root-block/utils/guard.js';
import { getPopperPosition } from '../../../root-block/utils/position.js';
import { menuGroups } from './config.js';
import { SlashMenu } from './slash-menu-popover.js';
import type { SlashMenuOptions } from './utils.js';

let globalAbortController = new AbortController();

function showSlashMenu({
  rootElement,
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
  options,
  triggerKey,
}: {
  rootElement: RootBlockComponent;
  model: BlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
  options: SlashMenuOptions;
  triggerKey: string;
}) {
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;
  const disposables = new DisposableGroup();
  abortController.signal.addEventListener('abort', () => disposables.dispose());

  const slashMenu = new SlashMenu();
  disposables.add(() => slashMenu.remove());
  slashMenu.model = model;
  slashMenu.abortController = abortController;
  slashMenu.options = options;
  slashMenu.rootElement = rootElement;
  slashMenu.triggerKey = triggerKey;

  // Handle position
  const updatePosition = throttle(() => {
    const slashMenuElement = slashMenu.slashMenuElement;
    assertExists(
      slashMenuElement,
      'You should render the slash menu node even if no position'
    );
    const position = getPopperPosition(slashMenuElement, range);
    slashMenu.updatePosition(position);
  }, 10);

  disposables.addFromEvent(window, 'resize', updatePosition);

  // FIXME(Flrande): It is not a best practice,
  // but merely a temporary measure for reusing previous components.
  // Mount
  container.append(slashMenu);
  // Wait for the Node to be mounted
  setTimeout(updatePosition);
  return slashMenu;
}

export const AFFINE_SLASH_MENU_WIDGET = 'affine-slash-menu-widget';

@customElement(AFFINE_SLASH_MENU_WIDGET)
export class AffineSlashMenuWidget extends WidgetElement {
  static DEFAULT_OPTIONS: SlashMenuOptions = {
    isTriggerKey: (event: KeyboardEvent): false | string => {
      const triggerKeys = [
        '/',
        // Compatible with CJK IME
        '、',
      ];

      if (
        event.key === 'Process' &&
        event.code === 'Slash' &&
        // See https://github.com/toeverything/blocksuite/issues/5197
        !event.shiftKey
      ) {
        // Ad-hoc for https://github.com/toeverything/blocksuite/issues/3485
        // This key can be triggered by pressing the slash key while using CJK IME in Windows.
        //
        // Description: The `Process` key. Instructs the IME to process the conversion.
        // See also https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#common_ime_keys
        // https://stackoverflow.com/questions/71961563/keyboard-event-has-key-process-on-chromebook
        return '/';
      }
      if (isControlledKeyboardEvent(event) || event.key.length !== 1)
        return false;
      const triggerKey = triggerKeys.find(key => key === event.key);
      if (!triggerKey) return false;
      return triggerKey;
    },
    menus: menuGroups,
  };

  options = AffineSlashMenuWidget.DEFAULT_OPTIONS;

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('keyDown', this._onKeyDown);
  }

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;
    const triggerKey = this.options.isTriggerKey(event);
    if (triggerKey === false) return;
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

    if (matchFlavours(model, ['affine:code'])) return;
    const inlineEditor = getInlineEditorByModel(this.host, model);
    if (!inlineEditor) return;
    inlineEditor.slots.inlineRangeApply.once(() => {
      const rootElement = this.blockElement;
      if (!isRootElement(rootElement)) {
        throw new Error('SlashMenuWidget should be used in RootBlock');
      }

      // Wait for dom update, see this case https://github.com/toeverything/blocksuite/issues/2611
      requestAnimationFrame(() => {
        const curRange = getCurrentNativeRange();
        showSlashMenu({
          rootElement,
          model,
          range: curRange,
          triggerKey,
          options: this.options,
        });
      });
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_SLASH_MENU_WIDGET]: AffineSlashMenuWidget;
  }
}
