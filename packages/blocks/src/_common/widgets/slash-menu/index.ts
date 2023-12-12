import type { UIEventStateContext } from '@blocksuite/block-std';
import {
  assertExists,
  DisposableGroup,
  throttle,
} from '@blocksuite/global/utils';
import { WidgetElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { customElement } from 'lit/decorators.js';

import {
  getCurrentNativeRange,
  getInlineEditorByModel,
  isControlledKeyboardEvent,
  matchFlavours,
} from '../../../_common/utils/index.js';
import type { PageBlockComponent } from '../../../page-block/types.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import { getPopperPosition } from '../../../page-block/utils/position.js';
import { menuGroups } from './config.js';
import { SlashMenu } from './slash-menu-popover.js';
import type { SlashMenuOptions } from './utils.js';

let globalAbortController = new AbortController();

function showSlashMenu({
  pageElement,
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
  options,
  triggerKey,
}: {
  pageElement: PageBlockComponent;
  model: BaseBlockModel;
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
  slashMenu.pageElement = pageElement;
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

  // Mount
  container.appendChild(slashMenu);
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
    const model = this.host.page.getBlockById(text.blockId);
    if (!model) {
      return;
    }

    if (matchFlavours(model, ['affine:code'])) return;
    const inlineEditor = getInlineEditorByModel(model);
    if (!inlineEditor) return;
    inlineEditor.slots.rangeUpdated.once(() => {
      const pageElement = this.blockElement;
      if (!isPageComponent(pageElement)) {
        throw new Error('SlashMenuWidget should be used in PageBlock');
      }

      // Wait for dom update, see this case https://github.com/toeverything/blocksuite/issues/2611
      requestAnimationFrame(() => {
        const curRange = getCurrentNativeRange();
        showSlashMenu({
          pageElement,
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
