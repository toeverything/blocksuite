import { IS_FIREFOX } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, unsafeCSS } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  BlockHubIcon,
  BlockHubRoundedRectangleIcon,
  BookmarkIcon,
  BulletedListIcon,
  CheckBoxIcon,
  CodeBlockIcon,
  CrossIcon,
  DatabaseTableViewIcon,
  DividerIcon,
  EmbedWebIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  NumberedListIcon,
  NumberedListIconLarge,
  QuoteIcon,
  TextIcon,
  TextIconLarge,
} from '../../_common/icons/index.js';
import type {
  AbstractEditor,
  EditingState,
  Rect,
} from '../../_common/utils/index.js';
import {
  calcDropTarget,
  type DroppingType,
  getBlockElementByModel,
  getClosestBlockElementByPoint,
  getDocPage,
  getEdgelessPage,
  getModelByBlockElement,
  isPageMode,
  Point,
} from '../../_common/utils/index.js';
import { DocPageBlockComponent } from '../../page-block/doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';
import { autoScroll } from '../../page-block/text-selection/utils.js';
import { type DragIndicator } from './drag-indicator.js';

export const BLOCKHUB_TEXT_ITEMS = [
  {
    flavour: 'affine:paragraph',
    type: 'text',
    name: 'Text',
    description: 'Start typing with plain text.',
    icon: TextIcon,
    tooltip: 'Drag/Click to insert Text block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h1',
    name: 'Heading 1',
    description: 'Headings in the largest font.',
    icon: Heading1Icon,
    tooltip: 'Drag/Click to insert Heading 1',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h2',
    name: 'Heading 2',
    description: 'Headings in the 2nd font size.',
    icon: Heading2Icon,
    tooltip: 'Drag/Click to insert Heading 2',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h3',
    name: 'Heading 3',
    description: 'Headings in the 3rd font size.',
    icon: Heading3Icon,
    tooltip: 'Drag/Click to insert Heading 3',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h4',
    name: 'Heading 4',
    description: 'Heading in the 4th font size.',
    icon: Heading4Icon,
    tooltip: 'Drag/Click to insert Heading 4',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h5',
    name: 'Heading 5',
    description: 'Heading in the 5th font size.',
    icon: Heading5Icon,
    tooltip: 'Drag/Click to insert Heading 5',
  },
  {
    flavour: 'affine:paragraph',
    type: 'h6',
    name: 'Heading 6',
    description: 'Heading in the 6th font size.',
    icon: Heading6Icon,
    tooltip: 'Drag/Click to insert Heading 6',
  },
  {
    flavour: 'affine:code',
    type: null,
    name: 'Code Block',
    description: 'Capture a code snippet.',
    icon: CodeBlockIcon,
    tooltip: 'Drag/Click to insert Code Block',
  },
  {
    flavour: 'affine:paragraph',
    type: 'quote',
    name: 'Quote',
    description: 'Capture a quote.',
    icon: QuoteIcon,
    tooltip: 'Drag/Click to insert Quote',
  },
  {
    flavour: 'affine:divider',
    type: null,
    name: 'Divider',
    description: 'A visual divider.',
    icon: DividerIcon,
    tooltip: 'A visual divider',
  },
];

export const BLOCKHUB_LIST_ITEMS = [
  {
    flavour: 'affine:list',
    type: 'bulleted',
    name: 'Bulleted List',
    description: 'A simple bulleted list.',
    icon: BulletedListIcon,
    tooltip: 'Drag/Click to insert Bulleted List',
  },
  {
    flavour: 'affine:list',
    type: 'numbered',
    name: 'Numbered List',
    description: 'A list with numbering.',
    icon: NumberedListIcon,
    tooltip: 'Drag/Click to insert Numbered List',
  },
  {
    flavour: 'affine:list',
    type: 'todo',
    name: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: CheckBoxIcon,
    tooltip: 'Drag/Click to insert To-do List',
  },
];

export const BLOCKHUB_FILE_ITEMS = [
  {
    flavour: 'affine:image',
    type: 'image',
    name: 'Image',
    description: 'Upload images.',
    icon: ImageIcon,
    tooltip: 'Drag/Click to insert Image',
  },
  {
    flavour: 'affine:bookmark',
    type: 'bookmark',
    name: 'Bookmark',
    description: 'Insert a link in card view.',
    icon: BookmarkIcon,
    tooltip: 'Drag/Click to insert Bookmark',
  },
];

const styles = css`
  affine-block-hub {
    position: absolute;
    z-index: 3;
    user-select: none;
  }

  @media print {
    affine-block-hub {
      display: none;
    }
  }

  .affine-block-hub-container {
    width: 274px;
    position: absolute;
    right: calc(100% + 8px);
    overflow-y: unset;
    display: none;
    justify-content: center;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
    font-size: var(--affine-font-sm);
    background: var(--affine-background-overlay-panel-color);
    box-shadow: var(--affine-menu-shadow);
    border-radius: 8px;
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
    background: var(--affine-white-80);
    box-shadow: var(--affine-shadow-1);
    border-radius: 8px;
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
    background: var(--affine-hover-color);
    top: -2px;
    left: -2px;
  }

  .card-container-inner:hover .card-container.grabbing {
    top: unset;
    left: unset;
    box-shadow: var(--affine-shadow-2);
  }

  .card-description-container {
    display: block;
    width: 190px;
    color: var(--affine-text-primary-color);
    font-size: var(--affine-font-base);
    line-height: var(--affine-line-height);
    margin: 8px 0 8px 12px;
    text-align: justify;
  }

  .affine-block-hub-container .description {
    font-size: var(--affine-font-sm);
    line-height: var(--affine-line-height);
    color: var(--affine-text-secondary-color);
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
    color: var(--affine-text-secondary-color);
    font-size: var(--affine-font-base);
    user-select: none;
  }

  .prominent {
    z-index: 1;
  }

  .block-hub-menu-container {
    display: flex;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    flex-flow: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    width: 44px;
    background: var(--affine-background-primary-color);
    border-radius: 8px;
  }

  .block-hub-menu-container[expanded] {
    box-shadow: var(--affine-menu-shadow);
    background: var(--affine-background-overlay-panel-color);
  }

  .block-hub-icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 8px;
    position: relative;
    border-radius: 4px;
    color: var(--affine-icon-color);
    height: 36px;
  }
  .block-hub-icon-container svg {
    width: 24px;
    height: 24px;
  }

  .block-hub-icon-container[selected='true'] {
    background: var(--affine-hover-color);
  }

  .block-hub-icon-container:hover {
    background: var(--affine-hover-color);
    border-radius: 4px;
  }

  .new-icon {
    width: 44px;
    height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    color: var(--affine-icon-color);
  }

  .new-icon-in-edgeless {
    box-shadow: var(--affine-menu-shadow);
  }
  .block-hub-menu-container[expanded] .new-icon {
    border-radius: 4px;
    box-shadow: unset;
  }

  .new-icon:hover {
    box-shadow: var(--affine-menu-shadow);
    background: var(--affine-white);
  }

  .icon-expanded {
    width: 36px;
    height: 36px;
  }

  .icon-expanded:hover {
    background: var(--affine-hover-color);
  }

  .block-hub-icons-container {
    width: 100%;
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0, 0, 0.55, 1.6);
  }

  .block-hub-icons-container > .divider {
    height: 1px;
    width: 36px;
    background: var(--affine-border-color);
    margin: 4px 0;
  }
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
                  class="card-container ${isGrabbing ? 'grabbing' : ''}"
                  draggable="true"
                  affine-flavour=${flavour}
                  affine-type=${type ?? ''}
                >
                  <div class="card-description-container">
                    <div>${name}</div>
                    <div class="description">${description}</div>
                  </div>
                  <div class="card-icon-container">${icon}</div>
                  ${showTooltip
                    ? html`<affine-tooltip
                        tip-position=${shouldScroll &&
                        index === blockHubItems.length - 1
                          ? 'top'
                          : 'bottom'}
                        >${tooltip}</affine-tooltip
                      >`
                    : null}
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
  expanded: boolean,
  isGrabbing: boolean,
  visibleCardType: CardListType | null,
  isCardListVisible: boolean,
  showTooltip: boolean,
  maxHeight: number
) {
  const menuNum = 5;
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
    'Content & Media',
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
        class="block-hub-icon-container ${isGrabbing ? 'grabbing' : 'grab'}"
        selected=${visibleCardType === 'blank' ? 'true' : 'false'}
        type="blank"
        draggable="true"
        affine-flavour="affine:paragraph"
        affine-type="text"
      >
        ${BlockHubRoundedRectangleIcon}
        ${showTooltip
          ? html`<affine-tooltip tip-position="left" .offset=${8}
              >Drag to insert blank line
            </affine-tooltip>`
          : null}
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
        ${blockHubFileCards} ${EmbedWebIcon}
      </div>
      <div
        class="block-hub-icon-container"
        type="database"
        draggable="true"
        affine-flavour="affine:database"
        selected=${visibleCardType === 'database' ? 'true' : 'false'}
      >
        ${DatabaseTableViewIcon}
        ${showTooltip
          ? html`<affine-tooltip tip-position="left" .offset=${8}>
              Drag to create a database
            </affine-tooltip>`
          : null}
      </div>
      <div class="divider"></div>
    </div>
  `;
}

@customElement('affine-block-hub')
export class BlockHub extends WithDisposable(ShadowlessElement) {
  /**
   * A function that returns all blocks that are allowed to be moved to
   */
  @property({ attribute: false })
  public getAllowedBlocks: () => BaseBlockModel[];

  @property({ attribute: false })
  public getHoveringNoteState: (point: Point) => {
    container?: Element;
    rect?: Rect;
    scale: number;
  };

  @state()
  private _expanded = false;

  @state()
  private _isGrabbing = false;

  @state()
  private _visibleCardType: CardListType | null = null;

  @state()
  private _showTooltip = true;
  @state()
  private _inEdgelessMode = false;

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

  private _page: Page;

  private readonly _onDragStartCallback: () => void;

  private readonly _onDropCallback: (
    e: DragEvent,
    point: Point,
    lastModelState: EditingState | null,
    lastType: DroppingType
  ) => Promise<void>;

  private readonly _onClickCardCallback: (data: {
    flavour: string;
    type?: string;
  }) => Promise<void>;

  private _currentClientX = 0;
  private _currentClientY = 0;
  private _isCardListVisible = false;
  private _indicator!: DragIndicator;
  private _lastDroppingTarget: EditingState | null = null;
  private _lastDroppingType: DroppingType = 'none';
  private _lastDraggingFlavour: string | null = null;
  private _timer: number | null = null;
  private _mouseRoot: AbstractEditor;
  private _rafID: number = 0;

  static override styles = styles;

  constructor(options: {
    mouseRoot: AbstractEditor;
    getAllowedBlocks: () => BaseBlockModel[];
    getHoveringNoteState: (point: Point) => {
      container?: Element;
      rect?: Rect;
      scale: number;
    };
    onDragStart: () => void;
    onDrop: (
      e: DragEvent,
      point: Point,
      lastModelState: EditingState | null,
      lastType: DroppingType
    ) => Promise<void>;
    onClickCard: (data: { flavour: string; type?: string }) => Promise<void>;
    page: Page;
  }) {
    super();
    this._page = options.page;
    this._mouseRoot = options.mouseRoot;
    this.getAllowedBlocks = options.getAllowedBlocks;
    this.getHoveringNoteState = options.getHoveringNoteState;

    this._onDragStartCallback = options.onDragStart;
    this._onDropCallback = options.onDrop;
    this._onClickCardCallback = options.onClickCard;
  }

  override connectedCallback() {
    super.connectedCallback();
    const disposables = this._disposables;
    disposables.addFromEvent(this, 'dragstart', this._onDragStart);
    disposables.addFromEvent(this, 'drag', this._onDrag);
    disposables.addFromEvent(this, 'dragend', this._onDragEnd);

    disposables.addFromEvent(this._mouseRoot, 'dragover', this._onDragOver);
    disposables.addFromEvent(this._mouseRoot, 'drop', this._onDrop);
    disposables.addFromEvent(this, 'mousedown', this._onMouseDown);
    disposables.add(
      this._mouseRoot.slots.pageModeSwitched.on(mode => {
        this._inEdgelessMode = mode === 'edgeless';
      })
    );
    if (IS_FIREFOX) {
      disposables.addFromEvent(
        this._mouseRoot,
        'dragover',
        this._onDragOverDocument
      );
    }

    this._onResize();
  }

  override firstUpdated() {
    const disposables = this._disposables;
    this._blockHubCards.forEach(card => {
      disposables.addFromEvent(card, 'mousedown', this._onCardMouseDown);
      disposables.addFromEvent(card, 'mouseup', this._onCardMouseUp);
      disposables.addFromEvent(card, 'click', e => this._onClickCard(e, card));
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
    disposables.addFromEvent(document, 'click', this._onClickOutside);
    disposables.addFromEvent(
      this._blockHubButton,
      'click',
      this._onBlockHubButtonClick
    );
    disposables.addFromEvent(this._blockHubButton, 'mousedown', e => {
      // Prevent input from losing focus
      e.preventDefault();
    });
    disposables.addFromEvent(
      this._blockHubIconsContainer,
      'transitionstart',
      this._onTransitionStart
    );
    disposables.addFromEvent(window, 'resize', this._onResize);

    this._indicator = <DragIndicator>(
      document.querySelector('affine-drag-indicator')
    );
    if (!this._indicator) {
      this._indicator = <DragIndicator>(
        document.createElement('affine-drag-indicator')
      );
      document.body.appendChild(this._indicator);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  /**
   * This is currently a workaround, as the height of the _blockHubIconsContainer is determined by the height of its
   * content, and if its child's opacity is set to 0 during a transition, its height won't change, causing the background
   * to exceeds its actual visual height. So currently we manually set the height of those whose opacity is 0 to 0px.
   */
  private _onTransitionStart = (_: TransitionEvent) => {
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

  private _onClickOutside = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof HTMLElement && !target.closest('affine-block-hub')) {
      this._hideCardList();
    }
  };

  private _onClickCard = (_: MouseEvent, blockHubElement: HTMLElement) => {
    const affineType = blockHubElement.getAttribute('affine-type');
    assertExists(affineType);
    const data: {
      flavour: string;
      type?: string;
    } = {
      flavour: blockHubElement.getAttribute('affine-flavour') ?? '',
    };
    if (affineType) {
      data.type = affineType;
    }
    this._onClickCardCallback(data);
  };

  public toggleMenu() {
    this._expanded = !this._expanded;
    if (!this._expanded) this._hideCardList();
  }

  private _onBlockHubButtonClick = (_: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._hideCardList();
    }
  };

  private _hideCardList() {
    if (this._visibleCardType) {
      this._visibleCardType = null;
      this._isCardListVisible = false;
    }
  }

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
    this._lastDraggingFlavour = data.flavour;
    this._onDragStartCallback();
  };

  private _onMouseDown = (e: MouseEvent) => {
    if (IS_FIREFOX) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
    }
  };

  private _onDrag = (e: DragEvent) => {
    this._hideCardList();
    let x = e.clientX;
    let y = e.clientY;
    if (IS_FIREFOX) {
      // In Firefox, `pageX` and `pageY` are always set to 0.
      // Refs: https://stackoverflow.com/questions/13110349/pagex-and-pagey-are-always-set-to-0-in-firefox-during-the-ondrag-event.
      x = this._currentClientX;
      y = this._currentClientY;
    }

    if (
      !this._indicator ||
      (this._indicator.rect &&
        this._indicator.rect.left === x &&
        this._indicator.rect.top === y)
    ) {
      return;
    }

    const point = new Point(x, y);
    const {
      container,
      rect: noteRect,
      scale,
    } = this.getHoveringNoteState(point.clone());
    if (!noteRect) {
      this._resetDropState();
      return;
    }
    let element: Element | null = null;
    element = getClosestBlockElementByPoint(
      point,
      { container, rect: noteRect, snapToEdge: { x: false, y: true } },
      scale
    );
    if (!element) {
      const { min, max } = noteRect;
      if (x >= min.x && x <= max.x && y >= min.y) {
        const lastBlock = this._pageBlockElement.model.lastChild();
        if (lastBlock) {
          const lastElement = getBlockElementByModel(lastBlock);
          element = lastElement;
        }
      }
    }
    if (!element) {
      // if (this._mouseRoot.mode === 'page') {
      //   return;
      // }
      this._resetDropState();
      return;
    }

    let type: DroppingType = 'none';
    let rect = null;
    let lastModelState = null;
    const model = getModelByBlockElement(element);
    const result = calcDropTarget(
      point,
      model,
      element,
      [],
      scale,
      this._lastDraggingFlavour
    );

    if (result) {
      type = result.type;
      rect = result.rect;
      lastModelState = result.modelState;
    }
    const runner = () => {
      // only support auto scroll in page mode now
      if (this._pageBlockElement instanceof DocPageBlockComponent) {
        const result = autoScroll(
          this._pageBlockElement.viewportElement,
          point.y
        );
        if (!result) {
          this._clearRaf();
          return;
        }
        this._rafID = requestAnimationFrame(runner);
      } else {
        this._clearRaf();
      }
    };

    this._rafID = requestAnimationFrame(runner);

    this._lastDroppingType = type;
    this._indicator.rect = rect;
    this._lastDroppingTarget = lastModelState;
  };

  private get _pageBlockElement() {
    const pageElement = isPageMode(this._page)
      ? (getDocPage(this._page) as DocPageBlockComponent)
      : (getEdgelessPage(this._page) as EdgelessPageBlockComponent);
    return pageElement;
  }

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  private _onDragOver = (e: DragEvent) => {
    e.preventDefault();
    return false;
  };

  private _onDragOverDocument = (e: DragEvent) => {
    if (!IS_FIREFOX) {
      throw new Error('FireFox only');
    }
    this._currentClientX = e.clientX;
    this._currentClientY = e.clientY;
  };

  private _onDragEnd = (_: DragEvent) => {
    this._showTooltip = true;
    this._isGrabbing = false;
    this._lastDraggingFlavour = null;
    this._resetDropState();
  };

  private _resetDropState = () => {
    this._lastDroppingType = 'none';
    this._indicator.rect = null;
    this._lastDroppingTarget = null;
  };

  private _onDrop = (e: DragEvent) => {
    assertExists(e.dataTransfer);
    if (!e.dataTransfer.getData('affine/block-hub')) return;

    this._onDropCallback(
      e,
      // `drag.clientY` !== `dragend.clientY` in chrome.
      this._indicator?.rect?.min ?? new Point(e.clientX, e.clientY),
      this._lastDroppingTarget,
      this._lastDroppingType
    );
  };

  private _onCardMouseDown = (_: Event) => {
    this._isGrabbing = true;
  };

  private _onCardMouseUp = (_: Event) => {
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

  override render() {
    const blockHubMenu = BlockHubMenu(
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
    const classes = classMap({
      'icon-expanded': this._expanded,
      'new-icon-in-edgeless': this._inEdgelessMode && !this._expanded,
      'new-icon': true,
    });
    return html`
      <div
        class="block-hub-menu-container"
        ?expanded=${this._expanded}
        style="bottom: ${BOTTOM_OFFSET}px; right: ${RIGHT_OFFSET}px;"
      >
        ${blockHubMenu}
        <div class=${classes} role="menuitem" style="cursor:pointer;">
          ${this._expanded
            ? CrossIcon
            : [
                BlockHubIcon,
                html`<affine-tooltip tip-position="left"
                  >Insert blocks</affine-tooltip
                >`,
              ]}
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
