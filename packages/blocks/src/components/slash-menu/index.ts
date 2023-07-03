import type { UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists, matchFlavours } from '@blocksuite/store';
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  getCurrentNativeRange,
  getModelByElement,
  getVirgoByModel,
  throttle,
} from '../../__internal__/utils/index.js';
import { getPopperPosition } from '../../page-block/utils/position.js';
import { SlashMenu } from './slash-menu-popover.js';

export { SlashMenu } from './slash-menu-popover.js';

let globalAbortController = new AbortController();

function onAbort(
  e: Event,
  slashMenu: SlashMenu,
  positionCallback: () => void,
  model: BaseBlockModel
) {
  slashMenu.remove();
  window.removeEventListener('resize', positionCallback);

  // Clean slash text

  if (!e.target || !(e.target instanceof AbortSignal)) {
    throw new Error('Failed to clean slash search text! Unknown abort event');
  }
  // If not explicitly set in those methods, it defaults to "AbortError" DOMException.
  if (e.target.reason instanceof DOMException) {
    // Should not clean slash text when click away or abort
    return;
  }

  if (typeof e.target.reason !== 'string') {
    throw new Error('Failed to clean slash search text! Unknown abort reason');
  }
  const searchStr = '/' + e.target.reason;
  const text = model.text;
  if (!text) {
    console.warn(
      'Failed to clean slash search text! No text found for model',
      model
    );
    return;
  }
  const vEditor = getVirgoByModel(model);
  if (!vEditor) {
    console.warn(
      'Failed to clean slash search text! No vEditor found for model, model:',
      model
    );
    return;
  }
  const vRange = vEditor.getVRange();
  assertExists(vRange);
  const idx = vRange.index - searchStr.length;

  const textStr = text.toString().slice(idx, idx + searchStr.length);
  if (textStr !== searchStr) {
    console.warn(
      `Failed to clean slash search text! Text mismatch expected: ${searchStr} but actual: ${textStr}`
    );
    return;
  }
  text.delete(idx, searchStr.length);
  vEditor.setVRange({
    index: idx,
    length: 0,
  });
}

export function showSlashMenu({
  model,
  range,
  container = document.body,
  abortController = new AbortController(),
}: {
  model: BaseBlockModel;
  range: Range;
  container?: HTMLElement;
  abortController?: AbortController;
}) {
  // Abort previous format quick bar
  globalAbortController.abort();
  globalAbortController = abortController;

  const slashMenu = new SlashMenu();
  slashMenu.model = model;
  slashMenu.abortController = abortController;

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

  window.addEventListener('resize', updatePosition);

  // Mount
  container.appendChild(slashMenu);
  // Wait for the Node to be mounted
  setTimeout(updatePosition);

  // Handle dispose
  abortController.signal.addEventListener('abort', e => {
    onAbort(e, slashMenu, updatePosition, model);
  });

  return slashMenu;
}

@customElement('affine-slash-menu-widget')
export class SlashMenuWidget extends WithDisposable(LitElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  abortController = new AbortController();

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.root.uiEventDispatcher.add('keyDown', this._onKeyDown)
    );
  }

  private _onKeyDown = (ctx: UIEventStateContext) => {
    const flag = this.root.page.awarenessStore.getFlag('enable_slash_menu');
    if (!flag) return;

    const eventState = ctx.get('keyboardState');
    const event = eventState.event as KeyboardEvent;
    if (
      event.key !== '/' &&
      // Compatible with CJK IME
      event.key !== '、'
    )
      return;

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
        showSlashMenu({ model, range: curRange });
      });
    });
  };
}
