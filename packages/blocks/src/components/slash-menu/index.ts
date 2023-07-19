import type { UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import {
  assertExists,
  DisposableGroup,
  matchFlavours,
} from '@blocksuite/store';
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  getCurrentNativeRange,
  getModelByElement,
  getVirgoByModel,
  isControlledKeyboardEvent,
  throttle,
} from '../../__internal__/utils/index.js';
import { getPopperPosition } from '../../page-block/utils/position.js';
import { menuGroups } from './config.js';
import { SlashMenu } from './slash-menu-popover.js';
import type { SlashMenuOptions } from './utils.js';

let globalAbortController = new AbortController();

function showSlashMenu({
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
  options: SlashMenuOptions;
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

@customElement('affine-slash-menu-widget')
export class SlashMenuWidget extends WithDisposable(LitElement) {
  static DEFAULT_OPTIONS: SlashMenuOptions = {
    isTriggerKey: (event: KeyboardEvent) => {
      const triggerKeys = [
        '/',
        // Compatible with CJK IME
        '、',
      ];

      if (event.key === 'Process' && event.code === 'Slash') {
        // Ad-hoc for https://github.com/toeverything/blocksuite/issues/3485
        // This key can be triggered by pressing the slash key while using CJK IME in Windows.
        //
        // Description: The `Process` key. Instructs the IME to process the conversion.
        // See also https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#common_ime_keys
        // https://stackoverflow.com/questions/71961563/keyboard-event-has-key-process-on-chromebook
        return true;
      }
      return (
        !isControlledKeyboardEvent(event) &&
        event.key.length === 1 &&
        triggerKeys.includes(event.key)
      );
    },
    menus: menuGroups,
  };

  options = SlashMenuWidget.DEFAULT_OPTIONS;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.root.uiEventDispatcher.add('keyDown', this._onKeyDown)
    );
  }

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const flag = this.root.page.awarenessStore.getFlag('enable_slash_menu');
    if (!flag) return;

    const eventState = ctx.get('keyboardState');
    const event = eventState.raw;
    if (!this.options.isTriggerKey(event)) return;

    // Fixme @Saul-Mirone get model from getCurrentSelection
    const target = event.target;
    if (!target || !(target instanceof HTMLElement)) return;
    const model = getModelByElement(target);

    if (matchFlavours(model, ['affine:code'])) return;
    const vEditor = getVirgoByModel(model);
    if (!vEditor) return;
    vEditor.slots.rangeUpdated.once(() => {
      // Wait for dom update, see this case https://github.com/toeverything/blocksuite/issues/2611
      requestAnimationFrame(() => {
        const curRange = getCurrentNativeRange();
        showSlashMenu({
          model,
          range: curRange,
          options: this.options,
        });
      });
    });
  };
}
