import { css, html, TemplateResult } from 'lit';
import { customElement, query, queryAll } from 'lit/decorators.js';
import { NonShadowLitElement } from '../__internal__/index.js';
import type {
  DragHandleGetModelStateCallback,
  DragHandleGetModelStateWithCursorCallback,
  DragIndicator,
} from './drag-handle.js';
import type { EditingState } from '../page-block/default/utils.js';
import { centeredToolTipStyle, toolTipStyle } from './tooltip.js';
import { assertExists, isFirefox } from '@blocksuite/global/utils';
import {
  BulletedListIconLarge,
  CrossIcon,
  RectIcon,
  TextIconLarge,
  BlockHubIcon,
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
} from '@blocksuite/global/config';

type BlockHubItem = {
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  toolTip: string;
};

@customElement('affine-block-hub')
export class BlockHub extends NonShadowLitElement {
  @queryAll('.card-container')
  private _blockHubCards!: Array<HTMLElement>;

  @queryAll('.block-hub-icon-container[type]')
  private _blockHubMenus!: Array<HTMLElement>;

  @query('.new-icon')
  private _blockHubButton!: HTMLElement;

  @query('.block-hub-icons-container')
  private _blockHubIconsContainer!: HTMLElement;

  @query('.block-hub-menu-container')
  private _blockHubMenuContainer!: HTMLElement;

  private _onDropCallback: (e: DragEvent, lastModelState: EditingState) => void;
  private _getBlockEditingStateByPosition: DragHandleGetModelStateCallback | null =
    null;
  private _getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback | null =
    null;

  private _currentPageX = 0;
  private _currentPageY = 0;
  private _indicator!: DragIndicator;
  private _indicatorHTMLTemplate!: TemplateResult<1>;
  private _lastModelState: EditingState | null = null;
  private _cursor: number | null = 0;
  private _expanded = false;
  private _isGrabbing = false;
  private _isCardListVisible = false;
  private _cardVisibleType = '';
  private _showToolTip = true;
  private _timer: number | null = null;
  private _delay = 200; // ms

  static styles = css`
    .affine-block-hub-container {
      width: 280px;
      position: absolute;
      right: calc(100% + 10px);
      top: calc(50%);
      transform: translateY(-50%);
      display: none;
      justify-content: center;
      fill: var(--affine-icon-color);
      font-size: var(--affine-font-sm);
      background: var(--affine-block-hub-background);
      box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
      border-radius: 10px;
    }

    .affine-block-hub-container[type='text'] {
      top: unset;
      bottom: 0px;
      transform: unset;
      right: calc(100% + 5.5px);
    }

    .visible {
      display: flex;
    }

    .invisible {
      display: none;
    }

    .card-container {
      display: flex;
      align-items: center;
      width: 256px;
      height: 54px;
      // TODO 颜色待定
      background: #ffffff;
      box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.08),
        4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
      border-radius: 10px;
      padding: 8px 12px;
      margin-bottom: 16px;
      cursor: grab;
    }

    .card-container:hover {
      background: var(--affine-block-hub-hover-background);
      fill: var(--affine-primary-color);
    }

    .card-description-container {
      display: block;
      width: 200px;
      color: var(--affine-text-color);
      text-align: justify;
    }

    .affine-block-hub-container .description {
      font-size: var(--affine-font-xs);
    }

    .grabbing {
      cursor: grabbing;
    }

    .affine-block-hub-title-container {
      margin: 16px 0 20px 12px;
      color: var(--affine-line-number-color);
    }

    .prominent {
      z-index: 1;
    }

    .block-hub-menu-container {
      display: flex;
      font-family: var(--affine-font-family);
      flex-flow: column;
      justify-content: center;
      align-items: center;
      padding: 4px;
      position: fixed;
      right: 24px;
      bottom: 70px;
      width: 44px;
      background: #ffffff;
      box-shadow: 0px 1px 10px -6px rgba(24, 39, 75, 0.08),
        0px 3px 16px -6px rgba(24, 39, 75, 0.04);
      border-radius: 10px;
    }

    .block-hub-icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 8px;
      position: relative;
      fill: var(--affine-line-number-color);
      height: 36px;
    }

    .block-hub-icon-container[selected='true'] {
      background: var(--affine-code-block-background);
      border: 0.5px solid #d0d7e3;
      border-radius: 5px;
    }

    .new-icon {
      width: 44px;
      height: 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      border-radius: 10px;
      fill: var(--affine-line-number-color);
    }

    .new-icon:hover {
      box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
      background: #ffffff;
    }

    .icon-expanded {
      width: 36px;
      height: 36px;
    }

    .icon-expanded:hover {
      background: #f1f3fe;
      box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
    }

    .divider {
      height: 1px;
      width: 36px;
      background: var(--affine-border-color);
      margin: 4px 0;
    }

    tool-tip:is([tip-position='left']) {
      left: 0;
      right: unset;
      top: 10px;
      transform: translateX(calc(-100% - 7px));
      border-radius: 10px 10px 0px 10px;
    }

    .block-hub-icons-container {
      position: relative;
      opacity: 0;
      top: 100px;
      height: 0px;
      transition: all 0.2s cubic-bezier(0, 0, 0.55, 1.6);
    }

    .block-hub-icons-container[transition] {
      opacity: 1;
      top: 0px;
    }

    ${centeredToolTipStyle}
    ${toolTipStyle}
  `;

  constructor(options: {
    onDropCallback: (e: DragEvent, lastModelState: EditingState) => void;
    getBlockEditingStateByPosition: DragHandleGetModelStateCallback;
    getBlockEditingStateByCursor: DragHandleGetModelStateWithCursorCallback;
  }) {
    super();
    this._onDropCallback = options.onDropCallback;
    this._getBlockEditingStateByPosition =
      options.getBlockEditingStateByPosition;
    this._getBlockEditingStateByCursor = options.getBlockEditingStateByCursor;
    document.body.appendChild(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dragstart', this._onDragStart);
    this.addEventListener('drag', this._onDrag);
    this.addEventListener('dragend', this._onDragEnd);

    document.addEventListener('dragover', this._onDragOver);
    document.addEventListener('drop', this._onDrop);
    isFirefox &&
      document.addEventListener('dragover', this._onDragOverDocument);
    this.addEventListener('mousedown', this._onMouseDown);
  }

  protected firstUpdated() {
    this._blockHubCards.forEach(card => {
      card.addEventListener('mousedown', this._onCardMouseDown);
      card.addEventListener('mouseup', this._onCardMouseUp);
    });
    for (const blockHubMenu of this._blockHubMenus) {
      blockHubMenu.addEventListener('mouseover', this._onBlockHubMenuMouseOver);
    }

    document.addEventListener('click', this._onClick);
    this._blockHubButton.addEventListener('click', this._onBlockHubButtonClick);
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicatorHTMLTemplate = html` <affine-drag-indicator></affine-drag-indicator>`;
    }
    this._blockHubIconsContainer.addEventListener(
      'transitionstart',
      this._onTransitionStart
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dragstart', this._onDragStart);
    this.removeEventListener('drag', this._onDrag);
    this.removeEventListener('dragend', this._onDragEnd);

    // FIXME: do not listen on the document
    document.removeEventListener('dragover', this._onDragOver);
    document.removeEventListener('drop', this._onDrop);
    isFirefox &&
      document.removeEventListener('dragover', this._onDragOverDocument);
    this.removeEventListener('mousedown', this._onMouseDown);

    if (this.hasUpdated) {
      this._blockHubCards.forEach(card => {
        card.removeEventListener('mousedown', this._onCardMouseDown);
        card.removeEventListener('mouseup', this._onCardMouseUp);
      });
      for (const blockHubMenu of this._blockHubMenus) {
        blockHubMenu.removeEventListener(
          'mouseover',
          this._onBlockHubMenuMouseOver
        );
      }
      document.removeEventListener('click', this._onClick);
      this._blockHubButton.removeEventListener(
        'click',
        this._onBlockHubButtonClick
      );
      this._blockHubIconsContainer.removeEventListener(
        'transitionstart',
        this._onTransitionStart
      );
    }
  }

  /**
   * This is currently a workaround, as the height of the _blockHubIconsContainer is determined by the height of its
   * content, and if its child's opacity is set to 0 during a transition, its height won't change, causing the background
   * to exceeds its actual visual height. So currently we manually set the height of those whose opacity is 0 to 0px.
   */
  private _onTransitionStart = (e: TransitionEvent) => {
    // see: https://stackoverflow.com/questions/40530990/transitionend-event-with-multiple-transitions-detect-last-transition
    if (e.propertyName === 'opacity') {
      return;
    }
    if (this._timer) {
      clearTimeout(this._timer);
    }
    if (!this._expanded) {
      // when the _blockHubMenuContainer is unexpanded, should cancel the vertical padding making it a square
      this._blockHubMenuContainer.style.padding = '0px 4px';
      this._timer = window.setTimeout(() => {
        this._blockHubIconsContainer.style.height = '0px';
      }, this._delay);
    } else {
      this._blockHubIconsContainer.style.height = 'unset';
      this._blockHubMenuContainer.style.padding = '4px';
    }
  };

  private _shouldCardDisplay(type: string) {
    return (
      this._expanded &&
      this._isCardListVisible &&
      this._cardVisibleType === type
    );
  }

  private _blockHubMenuTemplate = () => {
    return html`
      <div class="block-hub-icons-container" ?transition=${this._expanded}>
        <div
          class="block-hub-icon-container has-tool-tip"
          selected=${this._cardVisibleType === 'blank' ? 'true' : 'false'}
          type="blank"
          draggable="true"
          affine-flavour="affine:paragraph"
          affine-type="text"
        >
          ${RectIcon}
          <tool-tip inert role="tooltip" tip-position="left" style="top: 5px"
            >Drag to Insert blank line
          </tool-tip>
        </div>
        <div
          class="block-hub-icon-container"
          type="text"
          selected=${this._cardVisibleType === 'text' ? 'true' : 'false'}
        >
          ${TextIconLarge}
        </div>
        <div
          class="block-hub-icon-container"
          type="list"
          selected=${this._cardVisibleType === 'list' ? 'true' : 'false'}
        >
          ${this._blockHubCardTemplate(BLOCKHUB_LIST_ITEMS, 'list', 'List')}
          ${BulletedListIconLarge}
        </div>
        <div class="divider"></div>
      </div>
    `;
  };
  private _blockHubCardTemplate = (
    blockHubItems: Array<BlockHubItem>,
    type: string,
    title: string
  ) => {
    return html`
      <div
        class="affine-block-hub-container ${this._shouldCardDisplay(type)
          ? 'visible'
          : ''}"
        type=${type}
      >
        <div>
          <div class="affine-block-hub-title-container">${title}</div>
          ${blockHubItems.map(
            ({ flavour, type, name, description, icon, toolTip }, index) => {
              return html`
                <div
                  class="has-tool-tip"
                  draggable="true"
                  affine-flavour=${flavour}
                  affine-type=${type}
                  style="z-index: ${blockHubItems.length - index}"
                >
                  <div
                    class="card-container ${this._isGrabbing ? 'grabbing' : ''}"
                  >
                    <div class="card-description-container">
                      <div>${name}</div>
                      <div class="description">${description}</div>
                    </div>
                    ${icon}
                  </div>
                  <centered-tool-tip
                    tip-position="bottom"
                    style=${this._showToolTip ? '' : 'display: none'}
                    >${toolTip}
                  </centered-tool-tip>
                </div>
              `;
            }
          )}
        </div>
      </div>
    `;
  };

  private _onClick = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof HTMLElement && !target.closest('affine-block-hub')) {
      this._isCardListVisible = false;
      this._cardVisibleType = '';
      this.requestUpdate();
    }
  };

  private _onBlockHubButtonClick = (e: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._cardVisibleType = '';
      this._isCardListVisible = false;
    }
    this.requestUpdate();
  };

  private _onDragStart = (event: DragEvent) => {
    this._showToolTip = false;
    // DragEvent that doesn't dispatch manually, is expected to have dataTransfer property
    assertExists(event.dataTransfer);
    event.dataTransfer.effectAllowed = 'move';
    const blockHubElement = event.target as HTMLElement;
    const affineType = blockHubElement.getAttribute('affine-type');
    const data: {
      flavour: string | null;
      type?: string;
    } = {
      flavour: blockHubElement.getAttribute('affine-flavour'),
    };
    if (affineType) {
      data.type = affineType;
    }
    event.dataTransfer.setData('affine/block-hub', JSON.stringify(data));
    this.requestUpdate();
  };

  private _onMouseDown = (e: MouseEvent) => {
    if (isFirefox) {
      this._currentPageX = e.pageX;
      this._currentPageY = e.pageY;
    }
  };

  private _onDrag = (e: DragEvent) => {
    let x = e.pageX;
    let y = e.pageY;
    if (isFirefox) {
      // In Firefox, `pageX` and `pageY` are always set to 0.
      // Refs: https://stackoverflow.com/questions/13110349/pagex-and-pagey-are-always-set-to-0-in-firefox-during-the-ondrag-event.
      x = this._currentPageX;
      y = this._currentPageY;
    }

    const modelState = this._cursor
      ? this._getBlockEditingStateByCursor?.(x, y, this._cursor, 5, false, true)
      : this._getBlockEditingStateByPosition?.(x, y, true);

    if (modelState) {
      this._cursor = modelState.index;
      this._lastModelState = modelState;
      this._indicator.targetRect = modelState.position;
    }
    this._indicator.cursorPosition = {
      x,
      y,
    };
  };

  private _onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!isFirefox) {
      throw new Error('FireFox only');
    }
    this._currentPageX = e.pageX;
    this._currentPageY = e.pageY;
  };

  private _onDragEnd = (e: DragEvent) => {
    this._showToolTip = true;
    this._isGrabbing = false;
    if (this._indicator.cursorPosition && this._indicator.targetRect) {
      this._isCardListVisible = false;
      this._cardVisibleType = '';
    }
    this._indicator.cursorPosition = null;
    this._indicator.targetRect = null;
    this.requestUpdate();
  };

  private _onDrop = (e: DragEvent) => {
    assertExists(e.dataTransfer);
    if (!e.dataTransfer.getData('affine/block-hub')) {
      return;
    }
    assertExists(this._lastModelState);
    this._onDropCallback(e, this._lastModelState);
  };

  private _onCardMouseDown = (e: Event) => {
    this._isGrabbing = true;
    this.requestUpdate();
  };

  private _onCardMouseUp = (e: Event) => {
    this._isGrabbing = false;
    this.requestUpdate();
  };

  private _onBlockHubMenuMouseOver = (e: Event) => {
    const menu = e.currentTarget as HTMLElement;
    const cardType = menu.getAttribute('type');
    assertExists(cardType);
    this._isCardListVisible = true;
    this._cardVisibleType = cardType;
    this.requestUpdate();
  };

  override render() {
    return html`
      <div class="block-hub-menu-container">
        ${this._blockHubMenuTemplate()}
        <div
          class="has-tool-tip new-icon ${this._expanded ? 'icon-expanded' : ''}"
          role="menu-entry"
        >
          ${this._expanded ? CrossIcon : BlockHubIcon}
          <tool-tip
            class=${this._expanded ? 'invisible' : ''}
            inert
            tip-position="left"
            role="tooltip"
            >insert blocks
          </tool-tip>
        </div>
        ${this._blockHubCardTemplate(BLOCKHUB_TEXT_ITEMS, 'text', 'Text block')}
      </div>
      ${this._indicatorHTMLTemplate}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-hub': BlockHub;
  }
}
