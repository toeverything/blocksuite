import type { UIEventStateContext } from '@blocksuite/block-std';

import { getInlineEditorByModel } from '@blocksuite/affine-components/rich-text';
import {
  getCurrentNativeRange,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import {
  DisposableGroup,
  assertExists,
  debounce,
  throttle,
} from '@blocksuite/global/utils';
import { customElement } from 'lit/decorators.js';

import type { RootBlockComponent } from '../../types.js';

import { getPopperPosition } from '../../utils/position.js';
import {
  type SlashMenuActionItem,
  type SlashMenuContext,
  type SlashMenuGroupDivider,
  type SlashMenuItem,
  type SlashMenuItemGenerator,
  type SlashMenuStaticConfig,
  type SlashSubMenu,
  defaultSlashMenuConfig,
} from './config.js';
import { SlashMenu } from './slash-menu-popover.js';
import { filterEnabledSlashMenuItems } from './utils.js';

export { insertContent } from './utils.js';

export type AffineSlashMenuContext = SlashMenuContext;
export type AffineSlashMenuItem = SlashMenuItem;
export type AffineSlashMenuActionItem = SlashMenuActionItem;
export type AffineSlashMenuItemGenerator = SlashMenuItemGenerator;
export type AffineSlashSubMenu = SlashSubMenu;
export type AffineSlashMenuGroupDivider = SlashMenuGroupDivider;

let globalAbortController = new AbortController();

function closeSlashMenu() {
  globalAbortController.abort();
}

const showSlashMenu = debounce(
  ({
    context,
    range,
    container = document.body,
    abortController = new AbortController(),
    config,
    triggerKey,
  }: {
    context: SlashMenuContext;
    range: Range;
    container?: HTMLElement;
    abortController?: AbortController;
    config: SlashMenuStaticConfig;
    triggerKey: string;
  }) => {
    globalAbortController = abortController;
    const disposables = new DisposableGroup();
    abortController.signal.addEventListener('abort', () =>
      disposables.dispose()
    );

    const inlineEditor = getInlineEditorByModel(
      context.rootComponent.host,
      context.model
    );
    if (!inlineEditor) return;
    const slashMenu = new SlashMenu(inlineEditor, abortController);
    disposables.add(() => slashMenu.remove());
    slashMenu.context = context;
    slashMenu.config = config;
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
  },
  100
);

export const AFFINE_SLASH_MENU_WIDGET = 'affine-slash-menu-widget';

@customElement(AFFINE_SLASH_MENU_WIDGET)
export class AffineSlashMenuWidget extends WidgetComponent {
  private _onBeforeInput = (ctx: UIEventStateContext) => {
    const eventState = ctx.get('defaultState');
    const event = eventState.event as InputEvent;

    const triggerKey = event.data;
    if (!triggerKey || !this.config.triggerKeys.includes(triggerKey)) return;

    const textSelection = this.host.selection.find('text');
    if (!textSelection) return;

    const block = this.host.doc.getBlock(textSelection.blockId);
    assertExists(block);

    const { model } = block;

    if (matchFlavours(model, this.config.ignoreBlockTypes)) return;

    const inlineEditor = getInlineEditorByModel(this.host, model);
    if (!inlineEditor) return;

    inlineEditor.slots.inlineRangeApply.once(() => {
      const rootComponent = this.block;
      if (rootComponent.model.flavour !== 'affine:page') {
        console.error('SlashMenuWidget should be used in RootBlock');
        return;
      }

      const config: SlashMenuStaticConfig = {
        ...this.config,
        items: filterEnabledSlashMenuItems(this.config.items, {
          model,
          rootComponent: rootComponent as RootBlockComponent,
        }),
      };

      // Wait for dom update, see this case https://github.com/toeverything/blocksuite/issues/2611
      requestAnimationFrame(() => {
        const curRange = getCurrentNativeRange();
        if (!curRange) return;

        closeSlashMenu();
        showSlashMenu({
          context: {
            model,
            rootComponent: rootComponent as RootBlockComponent,
          },
          range: curRange,
          triggerKey,
          config,
        });
      });
    });
  };

  static DEFAULT_CONFIG = defaultSlashMenuConfig;

  config = AffineSlashMenuWidget.DEFAULT_CONFIG;

  override connectedCallback() {
    super.connectedCallback();

    if (this.config.triggerKeys.some(key => key.length === 0)) {
      console.error('Trigger key of slash menu should not be empty string');
      return;
    }

    this.handleEvent('beforeInput', this._onBeforeInput);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_SLASH_MENU_WIDGET]: AffineSlashMenuWidget;
  }
}
