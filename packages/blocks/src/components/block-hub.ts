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
} from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { css, html } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockComponentElement, IPoint } from '../__internal__/index.js';
import {
  getClosestBlockElementByPoint,
  getModelByBlockElement,
  getRectByBlockElement,
  NonShadowLitElement,
  Point,
} from '../__internal__/index.js';
import type { DefaultSelectionSlots } from '../index.js';
import type { EditingState } from '../page-block/default/utils.js';
import type { DragIndicator } from './drag-handle.js';
import { tooltipStyle } from './tooltip/tooltip.js';

const styles = css`
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

  .card-container-inner:hover .card-container {
    background: var(--affine-card-hover-background);
    fill: var(--affine-primary-color);
    top: -2px;
    left: -2px;
  }

  .card-container-inner:hover .card-container.grabbing {
    top: unset;
    left: unset;
    box-shadow: 1px 1px 8px rgba(66, 65, 73, 0.12),
      0 0 12px rgba(66, 65, 73, 0.08);
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
      -4px -4px 13px rgba(58, 76, 92, 0.02), 6px 6px 36px rgba(58, 76, 92, 0.06);
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
      -4px -4px 13px rgba(58, 76, 92, 0.02), 6px 6px 36px rgba(58, 76, 92, 0.06);
  }

  .divider {
    height: 1px;
    width: 36px;
    background: var(--affine-border-color);
    margin: 4px 0;
  }

  [role='menuitem'] tool-tip {
    font-size: var(--affine-font-sm);
  }

  .block-hub-icons-container {
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0, 0, 0.55, 1.6);
  }

  ${tooltipStyle}
`;

type BlockHubItem = {
  flavour: string;
  type: string | null;
  name: string;
  description: string;
  icon: unknown;
  tooltip: string;
};

type CardListType = 'blank' | 'list' | 'text' | 'database' | 'file';

const TRANSITION_DELAY = 200;
const BOTTOM_OFFSET = 70;
const RIGHT_OFFSET = 24;
const TOP_DISTANCE = 24;

function shouldDisplayCard(
  type: CardListType | null,
  expanded: boolean,
  isCardListVisible: boolean,
  visibleCardType: CardListType | null
) {
  return expanded && isCardListVisible && visibleCardType === type;
}

function BlockHubCards(
  blockHubItems: BlockHubItem[],
  type: string,
  title: string,
  maxHeight: number,
  shouldDisplayCard: boolean,
  isGrabbing: boolean,
  showTooltip: boolean
) {
  const shouldScroll = maxHeight < 800;
  const styles = styleMap({
    maxHeight: `${maxHeight}px`,
    overflowY: shouldScroll ? 'scroll' : 'unset',
  });
  return html`
    <div
      class="affine-block-hub-container ${shouldDisplayCard ? 'visible' : ''}"
      style="${styles}"
      type=${type}
    >
      <div class="affine-block-hub-title-container">${title}</div>
      ${blockHubItems.map(
        ({ flavour, type, name, description, icon, tooltip }, index) => {
          return html`
            <div class="card-container-wrapper">
              <div class="card-container-inner">
                <div
                  class="card-container has-tool-tip ${isGrabbing
                    ? 'grabbing'
                    : ''}"
                  draggable="true"
                  affine-flavour=${flavour}
                  affine-type=${type ?? ''}
                >
                  <div class="card-description-container">
                    <div>${name}</div>
                    <div class="description">${description}</div>
                  </div>
                  <div class="card-icon-container">${icon}</div>
                  <tool-tip
                    tip-position=${shouldScroll &&
                    index === blockHubItems.length - 1
                      ? 'top'
                      : 'bottom'}
                    style="${showTooltip
                      ? ''
                      : 'display: none'}; z-index: ${blockHubItems.length -
                    index}"
                    >${tooltip}</tool-tip
                  >
                </div>
              </div>
            </div>
          `;
        }
      )}
    </div>
  `;
}

function BlockHubMenu(
  enableDatabase: boolean,
  expanded: boolean,
  isGrabbing: boolean,
  visibleCardType: CardListType | null,
  isCardListVisible: boolean,
  showTooltip: boolean,
  maxHeight: number
) {
  const menuNum = enableDatabase ? 5 : 4;
  const height = menuNum * 44 + 10;

  const blockHubListCards = BlockHubCards(
    BLOCKHUB_LIST_ITEMS,
    'list',
    'List',
    maxHeight,
    shouldDisplayCard('list', expanded, isCardListVisible, visibleCardType),
    isGrabbing,
    showTooltip
  );

  const blockHubFileCards = BlockHubCards(
    BLOCKHUB_FILE_ITEMS,
    'file',
    'Image or file',
    maxHeight,
    shouldDisplayCard('file', expanded, isCardListVisible, visibleCardType),
    isGrabbing,
    showTooltip
  );

  return html`
    <div
      class="block-hub-icons-container"
      ?transition=${expanded}
      style="height: ${expanded ? `${height}px` : '0'};"
    >
      <div
        class="block-hub-icon-container has-tool-tip ${isGrabbing
          ? 'grabbing'
          : 'grab'}"
        selected=${visibleCardType === 'blank' ? 'true' : 'false'}
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
          ?hidden=${!showTooltip}
          >Drag to insert blank line
        </tool-tip>
      </div>
      <div
        class="block-hub-icon-container"
        type="text"
        selected=${visibleCardType === 'text' ? 'true' : 'false'}
      >
        ${TextIconLarge}
      </div>
      <div
        class="block-hub-icon-container"
        type="list"
        selected=${visibleCardType === 'list' ? 'true' : 'false'}
      >
        ${blockHubListCards} ${NumberedListIconLarge}
      </div>
      <div
        class="block-hub-icon-container"
        type="file"
        selected=${visibleCardType === 'file' ? 'true' : 'false'}
      >
        ${blockHubFileCards} ${ImageIcon}
      </div>
      ${enableDatabase
        ? html`
            <div
              class="block-hub-icon-container has-tool-tip"
              type="database"
              draggable="true"
              affine-flavour="affine:database"
              selected=${visibleCardType === 'database' ? 'true' : 'false'}
            >
              ${DatabaseTableViewIcon}
              <tool-tip
                inert
                role="tooltip"
                tip-position="left"
                ?hidden=${!showTooltip}
              >
                Drag to create a database
              </tool-tip>
            </div>
          `
        : null}
      <div class="divider"></div>
    </div>
  `;
}

@customElement('affine-block-hub')
export class BlockHub extends NonShadowLitElement {
  /**
   * A function that returns all blocks that are allowed to be moved to
   */
  @property()
  public getAllowedBlocks: () => BaseBlockModel[];

  @property()
  slots!: DefaultSelectionSlots;

  @state()
  private _expanded = false;

  @state()
  private _isGrabbing = false;

  @state()
  private _visibleCardType: CardListType | null = null;

  @state()
  private _showTooltip = true;

  @state()
  private _maxHeight = 2000;

  @queryAll('.card-container')
  private _blockHubCards!: HTMLElement[];

  @queryAll('.block-hub-icon-container[type]')
  private _blockHubMenus!: HTMLElement[];

  @query('.new-icon')
  private _blockHubButton!: HTMLElement;

  @query('.block-hub-icons-container')
  private _blockHubIconsContainer!: HTMLElement;

  @query('.block-hub-menu-container')
  private _blockHubMenuContainer!: HTMLElement;

  @query('[role="menuitem"]')
  private _blockHubMenuEntry!: HTMLElement;

  private readonly _onDropCallback: (
    e: DragEvent,
    lastModelState: EditingState,
    point: IPoint
  ) => Promise<void>;

  private _currentClientX = 0;
  private _currentClientY = 0;
  private _isCardListVisible = false;
  private _indicator!: DragIndicator;
  private _lastModelState: EditingState | null = null;
  private _timer: number | null = null;
  private readonly _enableDatabase: boolean;
  private _mouseRoot: HTMLElement;
  private _disposables: DisposableGroup = new DisposableGroup();

  static styles = styles;

  constructor(options: {
    mouseRoot: HTMLElement;
    enableDatabase: boolean;
    onDropCallback: (
      e: DragEvent,
      lastModelState: EditingState,
      point: IPoint
    ) => Promise<void>;
  }) {
    super();
    this._mouseRoot = options.mouseRoot;
    this._enableDatabase = options.enableDatabase;
    this.getAllowedBlocks = () => {
      console.warn('you may forget to set `getAllowedBlocks`');
      return [];
    };
    this._onDropCallback = options.onDropCallback;
  }

  connectedCallback() {
    super.connectedCallback();
    const disposables = this._disposables;
    disposables.addFromEvent(this, 'dragstart', this._onDragStart);
    disposables.addFromEvent(this, 'drag', this._onDrag);
    disposables.addFromEvent(this, 'dragend', this._onDragEnd);

    disposables.addFromEvent(this._mouseRoot, 'dragover', this._onDragOver);
    disposables.addFromEvent(this._mouseRoot, 'drop', this._onDrop);
    disposables.addFromEvent(this, 'mousedown', this._onMouseDown);

    if (isFirefox) {
      disposables.addFromEvent(
        this._mouseRoot,
        'dragover',
        this._onDragOverDocument
      );
    }

    this._onResize();
  }

  firstUpdated() {
    const disposables = this._disposables;
    this._blockHubCards.forEach(card => {
      disposables.addFromEvent(card, 'mousedown', this._onCardMouseDown);
      disposables.addFromEvent(card, 'mouseup', this._onCardMouseUp);
    });
    for (const blockHubMenu of this._blockHubMenus) {
      disposables.addFromEvent(
        blockHubMenu,
        'mouseover',
        this._onBlockHubMenuMouseOver
      );
      if (blockHubMenu.getAttribute('type') === 'blank') {
        disposables.addFromEvent(
          blockHubMenu,
          'mousedown',
          this._onBlankMenuMouseDown
        );
        disposables.addFromEvent(
          blockHubMenu,
          'mouseup',
          this._onBlankMenuMouseUp
        );
      }
    }
    disposables.addFromEvent(
      this._blockHubMenuEntry,
      'mouseover',
      this._onBlockHubEntryMouseOver
    );
    disposables.addFromEvent(document, 'click', this._onClick);
    disposables.addFromEvent(
      this._blockHubButton,
      'click',
      this._onBlockHubButtonClick
    );
    disposables.addFromEvent(
      this._blockHubIconsContainer,
      'transitionstart',
      this._onTransitionStart
    );
    disposables.addFromEvent(window, 'resize', this._onResize);
    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
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
      }, TRANSITION_DELAY);
    } else {
      this._blockHubMenuContainer.style.padding = '4px';
      this._timer = window.setTimeout(() => {
        this._blockHubIconsContainer.style.overflow = 'unset';
      }, TRANSITION_DELAY);
    }
  };

  private _onClick = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof HTMLElement && !target.closest('affine-block-hub')) {
      this._isCardListVisible = false;
      this._visibleCardType = null;
    }
  };

  public toggleMenu(open: boolean) {
    if (open) {
      this._expanded = true;
    } else {
      this._expanded = false;
      this._visibleCardType = null;
      this._isCardListVisible = false;
    }
  }

  private _onBlockHubButtonClick = (e: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._visibleCardType = null;
      this._isCardListVisible = false;
    }
  };

  private _onDragStart = (event: DragEvent) => {
    this._showTooltip = false;
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
    this.slots.selectedRectsUpdated.emit([]);
  };

  private _onMouseDown = (e: MouseEvent) => {
    if (isFirefox) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
    }
  };

  private _onDrag = (e: DragEvent) => {
    let x = e.clientX;
    let y = e.clientY;
    if (isFirefox) {
      // In Firefox, `pageX` and `pageY` are always set to 0.
      // Refs: https://stackoverflow.com/questions/13110349/pagex-and-pagey-are-always-set-to-0-in-firefox-during-the-ondrag-event.
      x = this._currentClientX;
      y = this._currentClientY;
    }

    if (
      !this._indicator ||
      (this._indicator.cursorPosition &&
        this._indicator.cursorPosition.x === x &&
        this._indicator.cursorPosition.y === y)
    ) {
      return;
    }

    const element = getClosestBlockElementByPoint(new Point(x, y));

    if (element) {
      const rect = getRectByBlockElement(element);
      this._lastModelState = {
        rect,
        element: element as BlockComponentElement,
        model: getModelByBlockElement(element),
      };
      this._indicator.targetRect = rect;
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
    this._currentClientX = e.clientX;
    this._currentClientY = e.clientY;
  };

  private _onDragEnd = (e: DragEvent) => {
    this._showTooltip = true;
    this._isGrabbing = false;
    if (this._indicator.cursorPosition && this._indicator.targetRect) {
      this._isCardListVisible = false;
      this._visibleCardType = null;
    }
    this._indicator.cursorPosition = null;
    this._indicator.targetRect = null;
  };

  private _onDrop = (e: DragEvent) => {
    assertExists(e.dataTransfer);
    if (!e.dataTransfer.getData('affine/block-hub')) return;
    if (!this._lastModelState) return;

    this._onDropCallback(
      e,
      this._lastModelState,
      // `drag.clientY` !== `dragend.clientY` in chrome.
      this._indicator?.cursorPosition ?? {
        x: e.clientX,
        y: e.clientY,
      }
    );
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
    this._visibleCardType = cardType as CardListType;
  };

  private _onBlockHubEntryMouseOver = () => {
    this._isCardListVisible = false;
  };

  private _onResize = () => {
    const boundingClientRect = document.body.getBoundingClientRect();
    this._maxHeight = boundingClientRect.height - TOP_DISTANCE - BOTTOM_OFFSET;
  };

  render() {
    const blockHubMenu = BlockHubMenu(
      this._enableDatabase,
      this._expanded,
      this._isGrabbing,
      this._visibleCardType,
      this._isCardListVisible,
      this._showTooltip,
      this._maxHeight
    );

    const blockHubCards = BlockHubCards(
      BLOCKHUB_TEXT_ITEMS,
      'text',
      'Text block',
      this._maxHeight,
      shouldDisplayCard(
        'text',
        this._expanded,
        this._isCardListVisible,
        this._visibleCardType
      ),
      this._isGrabbing,
      this._showTooltip
    );

    return html`
      <div
        class="block-hub-menu-container"
        ?expanded=${this._expanded}
        style="bottom: ${BOTTOM_OFFSET}px; right: ${RIGHT_OFFSET}px;"
      >
        ${blockHubMenu}
        <div
          class="has-tool-tip new-icon ${this._expanded ? 'icon-expanded' : ''}"
          role="menuitem"
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
        ${blockHubCards}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-hub': BlockHub;
  }
}
