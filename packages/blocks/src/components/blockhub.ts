import {
  BLOCKHUB_FILE_ITEMS,
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
  BlockHubIcon,
  CrossIcon,
  DatabaseTableViewIcon,
  ImageIcon,
  NumberedListIconLarge,
  RectIcon,
  TextIconLarge,
} from '@blocksuite/global/config';
import {
  assertExists,
  DisposableGroup,
  isFirefox,
  Signal,
} from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html, TemplateResult } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { NonShadowLitElement } from '../__internal__/index.js';
import type { EditingState } from '../page-block/default/utils.js';
import {
  getBlockEditingStateByCursor,
  getBlockEditingStateByPosition,
} from '../page-block/default/utils.js';
import type { DragIndicator } from './drag-handle.js';
import { centeredToolTipStyle, toolTipStyle } from './tooltip/tooltip.js';

type BlockHubItem = {
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  toolTip: string;
};

export type CardListType = 'blank' | 'list' | 'text' | 'database' | 'file';

@customElement('affine-block-hub')
export class BlockHub extends NonShadowLitElement {
  /**
   * A function that returns all blocks that are allowed to be moved to
   */
  @property()
  public getAllowedBlocks: () => BaseBlockModel[];

  @property()
  updateSelectedRectsSignal: Signal<DOMRect[]> | null = null;

  @property()
  blockHubStatusUpdated: Signal<boolean> = new Signal<boolean>();

  @property()
  bottom = 70;

  @property()
  right = 24;

  @state()
  private _expanded = false;

  @state()
  private _isGrabbing = false;

  @state()
  private _isCardListVisible = false;

  @state()
  private _cardVisibleType: CardListType | null = null;

  @state()
  private _showToolTip = true;

  @state()
  private _maxHeight = 2000;

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

  private readonly _onDropCallback: (
    e: DragEvent,
    lastModelState: EditingState
  ) => Promise<void>;
  private _currentPageX = 0;
  private _currentPageY = 0;
  private _indicator!: DragIndicator;
  private _indicatorHTMLTemplate!: TemplateResult<1>;
  private _lastModelState: EditingState | null = null;
  private _cursor: number | null = 0;
  private _timer: number | null = null;
  private _delay = 200;
  private readonly _enable_database: boolean;
  private _mouseRoot: HTMLElement;
  private _topDistance = 24;
  private _disposables: DisposableGroup = new DisposableGroup();

  static styles = css`
    affine-block-hub {
      position: absolute;
      z-index: 1;
    }

    .affine-block-hub-container {
      width: 274px;
      position: absolute;
      right: calc(100% + 8px);
      top: calc(50%);
      overflow-y: unset;
      transform: translateY(-50%);
      display: none;
      justify-content: center;
      fill: var(--affine-icon-color);
      font-size: var(--affine-font-sm);
      background: var(--affine-hub-background);
      box-shadow: 0 0 8px rgba(66, 65, 73, 0.12);
      border-radius: 10px;
    }

    .affine-block-hub-container[type='text'] {
      top: unset;
      bottom: 0;
      transform: unset;
      right: calc(100% + 4px);
    }

    .visible {
      display: block;
    }

    .invisible {
      display: none;
    }

    .card-container-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      position: relative;
    }

    .card-container {
      display: flex;
      position: relative;
      align-items: center;
      width: 250px;
      height: 54px;
      background: var(--affine-page-background);
      box-shadow: 0 0 6px rgba(66, 65, 73, 0.08);
      border-radius: 10px;
      margin-bottom: 12px;
      cursor: grab;
      top: 0;
      left: 0;
      transition: all 0.1s ease-in-out;
    }

    .card-icon-container {
      display: flex;
      align-items: center;
      position: absolute;
      right: 12px;
    }

    .card-icon-container > svg {
      width: 20px;
      height: 20px;
    }

    .card-container:hover {
      background: var(--affine-card-hover-background);
      fill: var(--affine-primary-color);
      top: -2px;
      left: -2px;
    }

    .card-description-container {
      display: block;
      width: 190px;
      color: var(--affine-text-color);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      margin: 8px 0 8px 12px;
      text-align: justify;
    }

    .affine-block-hub-container .description {
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
      color: var(--affine-secondary-text-color);
      white-space: pre;
    }

    .card-container:hover.grabbing {
      top: unset;
      left: unset;
      box-shadow: 1px 1px 8px rgba(66, 65, 73, 0.12),
        0 0 12px rgba(66, 65, 73, 0.08);
    }

    .grabbing {
      cursor: grabbing;
    }

    .grab {
      cursor: grab;
    }

    .affine-block-hub-title-container {
      margin: 16px 0 20px 12px;
      color: var(--affine-secondary-text-color);
      font-size: var(--affine-font-base);
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
      position: fixed;
      width: 44px;
      background: var(--affine-page-background);
      border-radius: 10px;
    }

    .block-hub-menu-container[expanded] {
      box-shadow: 0px 0px 8px rgba(66, 65, 73, 0.12);
    }

    .block-hub-icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 8px;
      position: relative;
      background: var(--affine-page-background);
      border-radius: 5px;
      fill: var(--affine-line-number-color);
      height: 36px;
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

    .block-hub-menu-container[expanded] .new-icon {
      border-radius: 5px;
    }

    .new-icon:hover {
      box-shadow: 4px 4px 7px rgba(58, 76, 92, 0.04),
        -4px -4px 13px rgba(58, 76, 92, 0.02),
        6px 6px 36px rgba(58, 76, 92, 0.06);
      fill: var(--affine-primary-color);
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
      border-radius: 10px 10px 0 10px;
    }

    [role='menu-entry'] tool-tip {
      font-size: var(--affine-font-sm);
    }

    .block-hub-icons-container {
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0, 0, 0.55, 1.6);
    }

    ${centeredToolTipStyle}
    ${toolTipStyle}
  `;

  constructor(options: {
    mouseRoot: HTMLElement;
    enable_database: boolean;
    onDropCallback: (
      e: DragEvent,
      lastModelState: EditingState
    ) => Promise<void>;
  }) {
    super();
    this._mouseRoot = options.mouseRoot;
    this._enable_database = options.enable_database;
    this.getAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this._onDropCallback = options.onDropCallback;
  }

  connectedCallback() {
    super.connectedCallback();
    const disposables = this._disposables;
    disposables.add(
      Signal.disposableListener(this, 'dragstart', this._onDragStart)
    );
    disposables.add(Signal.disposableListener(this, 'drag', this._onDrag));
    disposables.add(
      Signal.disposableListener(this, 'dragend', this._onDragEnd)
    );

    disposables.add(
      Signal.disposableListener(this._mouseRoot, 'dragover', this._onDragOver)
    );
    disposables.add(
      Signal.disposableListener(this._mouseRoot, 'drop', this._onDrop)
    );
    isFirefox &&
      disposables.add(
        Signal.disposableListener(
          this._mouseRoot,
          'dragover',
          this._onDragOverDocument
        )
      );
    disposables.add(
      Signal.disposableListener(this, 'mousedown', this._onMouseDown)
    );
    this._onResize();
  }

  protected firstUpdated() {
    const disposables = this._disposables;
    this._blockHubCards.forEach(card => {
      disposables.add(
        Signal.disposableListener(card, 'mousedown', this._onCardMouseDown)
      );
      disposables.add(
        Signal.disposableListener(card, 'mouseup', this._onCardMouseUp)
      );
    });
    for (const blockHubMenu of this._blockHubMenus) {
      disposables.add(
        Signal.disposableListener(
          blockHubMenu,
          'mouseover',
          this._onBlockHubMenuMouseOver
        )
      );
      if (blockHubMenu.getAttribute('type') === 'blank') {
        disposables.add(
          Signal.disposableListener(
            blockHubMenu,
            'mousedown',
            this._onBlankMenuMouseDown
          )
        );
        disposables.add(
          Signal.disposableListener(
            blockHubMenu,
            'mouseup',
            this._onBlankMenuMouseUp
          )
        );
      }
    }
    disposables.add(
      Signal.disposableListener(
        this._blockHubMenuEntry,
        'mouseover',
        this._onBlockHubEntryMouseOver
      )
    );
    disposables.add(
      Signal.disposableListener(document, 'click', this._onClick)
    );
    disposables.add(
      Signal.disposableListener(
        this._blockHubButton,
        'click',
        this._onBlockHubButtonClick
      )
    );
    disposables.add(
      Signal.disposableListener(
        this._blockHubIconsContainer,
        'transitionstart',
        this._onTransitionStart
      )
    );
    disposables.add(
      Signal.disposableListener(window, 'resize', this._onResize)
    );
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicatorHTMLTemplate = html` <affine-drag-indicator></affine-drag-indicator>`;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  /**
   * This is currently a workaround, as the height of the _blockHubIconsContainer is determined by the height of its
   * content, and if its child's opacity is set to 0 during a transition, its height won't change, causing the background
   * to exceeds its actual visual height. So currently we manually set the height of those whose opacity is 0 to 0px.
   */
  private _onTransitionStart = (e: TransitionEvent) => {
    if (this._timer) {
      clearTimeout(this._timer);
    }
    if (!this._expanded) {
      // when the _blockHubMenuContainer is unexpanded, should cancel the vertical padding making it a square
      this._blockHubMenuContainer.style.padding = '0 4px';
      this._timer = window.setTimeout(() => {
        this._blockHubIconsContainer.style.overflow = 'hidden';
      }, this._delay);
    } else {
      this._blockHubMenuContainer.style.padding = '4px';
      this._timer = window.setTimeout(() => {
        this._blockHubIconsContainer.style.overflow = 'unset';
      }, this._delay);
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
    const menuNum = this._enable_database ? 5 : 4;
    const height = menuNum * 44 + 10;
    return html`
      <div
        class="block-hub-icons-container"
        ?transition=${this._expanded}
        style="height: ${this._expanded ? `${height}px` : '0'};"
      >
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
            >Drag to insert blank line
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
          ${NumberedListIconLarge}
        </div>
        <div
          class="block-hub-icon-container"
          type="file"
          selected=${this._cardVisibleType === 'file' ? 'true' : 'false'}
        >
          ${this._blockHubCardTemplate(
            BLOCKHUB_FILE_ITEMS,
            'file',
            'Image or file'
          )}
          ${ImageIcon}
        </div>
        ${this._enable_database
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
    const shouldScroll = this._maxHeight < 800;
    const styles = styleMap({
      maxHeight: `${this._maxHeight}px`,
      overflowY: shouldScroll ? 'scroll' : 'unset',
    });
    return html`
      <div
        class="affine-block-hub-container ${this._shouldCardDisplay(type)
          ? 'visible'
          : ''}"
        style="${styles}"
        type=${type}
      >
        <div class="affine-block-hub-title-container">${title}</div>
        ${blockHubItems.map(
          ({ flavour, type, name, description, icon, toolTip }, index) => {
            return html`
              <div class="card-container-wrapper">
                <div
                  class="card-container has-tool-tip ${this._isGrabbing
                    ? 'grabbing'
                    : ''}"
                  draggable="true"
                  affine-flavour=${flavour}
                  affine-type=${type}
                >
                  <div class="card-description-container">
                    <div>${name}</div>
                    <div class="description">${description}</div>
                  </div>
                  <div class="card-icon-container">${icon}</div>
                  <centered-tool-tip
                    tip-position=${shouldScroll &&
                    index === blockHubItems.length - 1
                      ? 'top'
                      : 'bottom'}
                    style="display: ${this._showToolTip
                      ? ''
                      : 'none'}; z-index: ${blockHubItems.length - index}"
                    >${toolTip}
                  </centered-tool-tip>
                </div>
              </div>
            `;
          }
        )}
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

  public toggleMenu(open: boolean) {
    if (open) {
      this._expanded = true;
    } else {
      this._expanded = false;
      this._cardVisibleType = null;
      this._isCardListVisible = false;
    }
  }

  private _onBlockHubButtonClick = (e: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._cardVisibleType = null;
      this._isCardListVisible = false;
    }
    this.blockHubStatusUpdated.emit(this._expanded);
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
    this.updateSelectedRectsSignal && this.updateSelectedRectsSignal.emit([]);
  };

  private _onMouseDown = (e: MouseEvent) => {
    if (isFirefox) {
      this._currentPageX = e.pageX;
      this._currentPageY = e.pageY;
    }

    this._refreshCursor(e);
  };

  private _refreshCursor = (e: MouseEvent) => {
    let x = e.pageX;
    let y = e.pageY;
    if (isFirefox) {
      x = this._currentPageX;
      y = this._currentPageY;
    }
    const blocks = this.getAllowedBlocks();
    const modelState = getBlockEditingStateByPosition(blocks, x, y, {
      skipX: true,
    });
    modelState
      ? (this._cursor = modelState.index)
      : (this._cursor = blocks.length - 1);
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
      boundingClientRect.height - this._topDistance - this.bottom;
  };

  override render() {
    return html`
      <div
        class="block-hub-menu-container"
        ?expanded=${this._expanded}
        style="bottom: ${this.bottom}px; right: ${this.right}px;"
      >
        ${this._blockHubMenuTemplate()}
        <div
          class="has-tool-tip new-icon ${this._expanded ? 'icon-expanded' : ''}"
          role="menu-entry"
          style="cursor:pointer;"
        >
          ${this._expanded ? CrossIcon : BlockHubIcon}
          <tool-tip
            class=${this._expanded ? 'invisible' : ''}
            inert
            tip-position="left"
            role="tooltip"
            >Insert blocks
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
