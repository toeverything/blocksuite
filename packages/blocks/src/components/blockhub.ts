import { css, html, TemplateResult } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { NonShadowLitElement } from '../__internal__/index.js';
import type { DragIndicator } from './drag-handle.js';
import type { EditingState } from '../page-block/default/utils.js';
import { centeredToolTipStyle, toolTipStyle } from './tooltip.js';
import { assertExists, isFirefox, Signal } from '@blocksuite/global/utils';
import {
  BulletedListIconLarge,
  CrossIcon,
  RectIcon,
  TextIconLarge,
  BlockHubIcon,
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
  DatabaseTableViewIcon,
} from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import {
  getBlockEditingStateByCursor,
  getBlockEditingStateByPosition,
} from '../page-block/default/utils.js';
import { styleMap } from 'lit/directives/style-map.js';

type BlockHubItem = {
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  toolTip: string;
};

export type CardListType = 'blank' | 'list' | 'text' | 'database';

@customElement('affine-block-hub')
export class BlockHub extends NonShadowLitElement {
  /**
   * A function that returns all blocks that are allowed to be moved to
   */
  @property()
  public getAllowedBlocks: () => BaseBlockModel[];

  @state()
  _expanded = false;

  @state()
  _isGrabbing = false;

  @state()
  _isCardListVisible = false;

  @state()
  _cardVisibleType: CardListType | null = null;

  @state()
  _showToolTip = true;

  @state()
  _maxHeight = 2000;

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

  @query('[role="menu-entry"]')
  private _blockHubMenuEntry!: HTMLElement;

  private _onDropCallback: (e: DragEvent, lastModelState: EditingState) => void;
  private _updateSelectedRectsSignal: Signal<DOMRect[]> | null = null;
  private _currentPageX = 0;
  private _currentPageY = 0;
  private _indicator!: DragIndicator;
  private _indicatorHTMLTemplate!: TemplateResult<1>;
  private _lastModelState: EditingState | null = null;
  private _cursor: number | null = 0;
  private _timer: number | null = null;
  private _delay = 200; // ms
  private enable_database: boolean;
  private _bottomDistance = 70;
  private _topDistance = 24;

  static styles = css`
    affine-block-hub {
      position: fixed;
      z-index: 1;
    }

    .affine-block-hub-container {
      width: 280px;
      position: absolute;
      right: calc(100% + 10px);
      top: calc(50%);
      overflow-y: auto;
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
      background: var(--affine-page-background);
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

    .grab {
      cursor: grab;
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
      width: 44px;
      background: var(--affine-page-background);
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

    .block-hub-icon-container:first-child {
      background: var(--affine-code-block-background);
      border: 0.5px solid var(--affine-border-color);
      border-radius: 5px;
    }

    .block-hub-icon-container[selected='true'] {
      fill: var(--affine-primary-color);
    }

    .block-hub-icon-container:hover {
      background: var(--affine-hover-background);
      border-radius: 5px;
    }

    .new-icon {
      width: 44px;
      height: 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: var(--affine-page-background);
      border-radius: 10px;
      fill: var(--affine-line-number-color);
    }

    .new-icon:hover {
      box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
      background: var(--affine-page-background);
    }

    .icon-expanded {
      width: 36px;
      height: 36px;
    }

    .icon-expanded:hover {
      background: var(--affine-hover-background);
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

  constructor(
    options: {
      enable_database: boolean;
      onDropCallback: (e: DragEvent, lastModelState: EditingState) => void;
    },
    updateSelectedRectsSignal?: Signal<DOMRect[]>
  ) {
    super();
    this.enable_database = options.enable_database;
    this.getAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this._onDropCallback = options.onDropCallback;
    updateSelectedRectsSignal &&
      (this._updateSelectedRectsSignal = updateSelectedRectsSignal);
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
      if (blockHubMenu.getAttribute('type') === 'blank') {
        blockHubMenu.addEventListener('mousedown', this._onBlankMenuMouseDown);
        blockHubMenu.addEventListener('mouseup', this._onBlankMenuMouseUp);
      }
    }
    this._blockHubMenuEntry.addEventListener(
      'mouseover',
      this._onBlockHubEntryMouseOver
    );

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
    window.addEventListener('resize', this._onResize);
    this._onResize();
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
    window.removeEventListener('resize', this._onResize);

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
        if (blockHubMenu.getAttribute('type') === 'blank') {
          blockHubMenu.removeEventListener(
            'mousedown',
            this._onBlankMenuMouseDown
          );
          blockHubMenu.removeEventListener('mouseup', this._onBlankMenuMouseUp);
        }
      }
      this._blockHubMenuEntry.addEventListener(
        'mouseover',
        this._onBlockHubEntryMouseOver
      );
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
          class="block-hub-icon-container has-tool-tip ${this._isGrabbing
            ? 'grabbing'
            : 'grab'}"
          selected=${this._cardVisibleType === 'blank' ? 'true' : 'false'}
          type="blank"
          draggable="true"
          affine-flavour="affine:paragraph"
          affine-type="text"
        >
          ${RectIcon}
          <tool-tip
            inert
            role="tooltip"
            tip-position="left"
            style="top: 5px"
            ?hidden=${!this._showToolTip}
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
        ${this.enable_database
          ? html`
              <div
                class="block-hub-icon-container has-tool-tip"
                type="database"
                draggable="true"
                affine-flavour="affine:database"
                selected=${this._cardVisibleType === 'database'
                  ? 'true'
                  : 'false'}
              >
                ${DatabaseTableViewIcon}
                <tool-tip
                  inert
                  role="tooltip"
                  tip-position="left"
                  style="top: 5px"
                  ?hidden=${!this._showToolTip}
                >
                  Drag to create a database
                </tool-tip>
              </div>
            `
          : null}
        <div class="divider"></div>
      </div>
    `;
  };
  private _blockHubCardTemplate = (
    blockHubItems: Array<BlockHubItem>,
    type: string,
    title: string
  ) => {
    const styles = styleMap({
      maxHeight: `${this._maxHeight}px`,
      overflowY: this._maxHeight < 800 ? 'scroll' : 'unset',
    });
    return html`
      <div
        class="affine-block-hub-container ${this._shouldCardDisplay(type)
          ? 'visible'
          : ''}"
        style="${styles}"
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
      this._cardVisibleType = null;
    }
  };

  private _onBlockHubButtonClick = (e: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._cardVisibleType = null;
      this._isCardListVisible = false;
    }
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
    this._updateSelectedRectsSignal && this._updateSelectedRectsSignal.emit([]);
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
      ? getBlockEditingStateByCursor(
          this.getAllowedBlocks(),
          x,
          y,
          this._cursor,
          {
            size: 5,
            skipX: false,
            dragging: true,
          }
        )
      : getBlockEditingStateByPosition(this.getAllowedBlocks(), x, y, {
          skipX: true,
        });

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
      this._cardVisibleType = null;
    }
    this._indicator.cursorPosition = null;
    this._indicator.targetRect = null;
  };

  private _onDrop = (e: DragEvent) => {
    assertExists(e.dataTransfer);
    if (!e.dataTransfer.getData('affine/block-hub')) {
      return;
    }
    if (!this._lastModelState) {
      return;
    }
    this._onDropCallback(e, this._lastModelState);
  };

  private _onCardMouseDown = (e: Event) => {
    this._isGrabbing = true;
  };

  private _onCardMouseUp = (e: Event) => {
    this._isGrabbing = false;
  };

  private _onBlankMenuMouseDown = () => {
    this._isGrabbing = true;
  };

  private _onBlankMenuMouseUp = () => {
    this._isGrabbing = false;
  };

  private _onBlockHubMenuMouseOver = (e: Event) => {
    const menu = e.currentTarget as HTMLElement;
    const cardType = menu.getAttribute('type');
    assertExists(cardType);
    this._isCardListVisible = true;
    this._cardVisibleType = cardType as CardListType;
  };

  private _onBlockHubEntryMouseOver = () => {
    this._isCardListVisible = false;
  };

  private _onResize = () => {
    const boundingClientRect = document.body.getBoundingClientRect();
    this._maxHeight =
      boundingClientRect.height - this._topDistance - this._bottomDistance;
  };

  override render() {
    return html`
      <div
        class="block-hub-menu-container"
        style="bottom: ${this._bottomDistance}px"
      >
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
