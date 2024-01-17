import { IS_FIREFOX } from '@blocksuite/global/env';
import { assertExists, assertInstanceOf } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { DragIndicator } from '../../../../_common/components/drag-indicator.js';
import { toggleEmbedCardCreateModal } from '../../../../_common/components/embed-card/modal/index.js';
import { BlockHubIcon, CrossIcon } from '../../../../_common/icons/index.js';
import {
  asyncFocusRichText,
  buildPath,
  calcDropTarget,
  type DroppingType,
  type EditingState,
  getClosestBlockElementByPoint,
  getDocPageByEditorHost,
  getEdgelessPageByEditorHost,
  getHoveringNote,
  getImageFilesFromLocal,
  getModelByBlockComponent,
  isInsideDocEditor,
  Point,
  Rect,
  stopPropagation,
} from '../../../../_common/utils/index.js';
import type { DatabaseService } from '../../../../database-block/database-service.js';
import { ImageService } from '../../../../image-block/image-service.js';
import {
  addImageBlocks,
  addSiblingImageBlock,
} from '../../../../image-block/utils.js';
import { DocPageBlockComponent } from '../../../../page-block/doc/doc-page-block.js';
import type { EdgelessPageBlockComponent } from '../../../../page-block/edgeless/edgeless-page-block.js';
import { autoScroll } from '../../../../page-block/text-selection/utils.js';
import { getClosestNoteBlock } from '../../drag-handle/utils.js';
import {
  BlockHubMenu,
  type CardListType,
} from './../components/block-hub-menu.js';
import {
  BOTTOM_OFFSET,
  RIGHT_OFFSET,
  TOP_DISTANCE,
  TRANSITION_DELAY,
} from './../config.js';
import { styles } from './../styles.js';

@customElement('affine-block-hub')
export class BlockHub extends WithDisposable(ShadowlessElement) {
  /**
   * A function that returns all blocks that are allowed to be moved to
   */
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

  private _currentClientX = 0;
  private _currentClientY = 0;
  private _isCardListVisible = false;
  private _indicator!: DragIndicator;
  private _lastDroppingTarget: EditingState | null = null;
  private _lastDroppingType: DroppingType = 'none';
  private _lastDraggingFlavour: string | null = null;
  private _timer: number | null = null;
  private _rafID: number = 0;
  private _editorHost: EditorHost;

  static override styles = styles;

  constructor(host: EditorHost) {
    super();
    this._editorHost = host;
  }

  override connectedCallback() {
    super.connectedCallback();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'dragstart', this._onDragStart);
    disposables.addFromEvent(this, 'drag', this._onDrag);
    disposables.addFromEvent(this, 'dragend', this._onDragEnd);
    disposables.addFromEvent(this._editorHost, 'dragover', this._onDragOver);
    disposables.addFromEvent(this._editorHost, 'drop', (e: DragEvent) => {
      this._onDrop(e).catch(console.error);
    });
    disposables.addFromEvent(this, 'mousedown', this._onMouseDown);

    if (IS_FIREFOX) {
      disposables.addFromEvent(
        this._editorHost,
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
      disposables.addFromEvent(card, 'click', e => {
        this._onClickCard(e, card).catch(console.error);
      });
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

  public toggleMenu() {
    this._expanded = !this._expanded;
    if (!this._expanded) this._hideCardList();
  }

  private get _pageBlockElement() {
    const pageElement = isInsideDocEditor(this._editorHost)
      ? (getDocPageByEditorHost(this._editorHost) as DocPageBlockComponent)
      : (getEdgelessPageByEditorHost(
          this._editorHost
        ) as EdgelessPageBlockComponent);
    return pageElement;
  }

  private _getHoveringNoteState = (point: Point) => {
    const state = {
      scale: 1,
    } as {
      container?: Element;
      rect?: Rect;
      scale: number;
    };

    if (isInsideDocEditor(this._editorHost)) {
      const closestNoteBlock = getClosestNoteBlock(
        this._editorHost,
        this._pageBlockElement,
        point
      );
      if (closestNoteBlock) {
        state.rect = Rect.fromDOMRect(closestNoteBlock.getBoundingClientRect());
      }
    } else {
      state.scale = (
        this._pageBlockElement as EdgelessPageBlockComponent
      ).surface.viewport.zoom;
      const container = getHoveringNote(point);
      if (container) {
        state.rect = Rect.fromDOM(container);
        state.container = container;
      }
    }
    return state;
  };

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

  private _hideCardList() {
    if (this._visibleCardType) {
      this._visibleCardType = null;
      this._isCardListVisible = false;
    }
  }

  private _onBlockHubButtonClick = (_: MouseEvent) => {
    this._expanded = !this._expanded;
    if (!this._expanded) {
      this._hideCardList();
    }
  };

  private _clearRaf() {
    if (this._rafID) {
      cancelAnimationFrame(this._rafID);
      this._rafID = 0;
    }
  }

  private _onMouseDown = (e: MouseEvent) => {
    if (IS_FIREFOX) {
      this._currentClientX = e.clientX;
      this._currentClientY = e.clientY;
    }
  };

  private _onDragStart = (event: DragEvent) => {
    this._showTooltip = false;
    // DragEvent that doesn't dispatch manually, is expected to have dataTransfer property
    assertExists(event.dataTransfer);
    event.dataTransfer.effectAllowed = 'move';
    const blockHubElement = event.target as HTMLElement;
    const data: {
      flavour: string | null;
      type?: string;
    } = {
      flavour: blockHubElement.getAttribute('affine-flavour'),
      type: blockHubElement.getAttribute('affine-type') ?? undefined,
    };
    event.dataTransfer.setData('affine/block-hub', JSON.stringify(data));
    this._lastDraggingFlavour = data.flavour;
    this._pageBlockElement.selection.clear();
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
    } = this._getHoveringNoteState(point.clone());

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
          const lastElement = this._editorHost.view.viewFromPath('block', [
            lastBlock.id,
          ]);
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
    const model = getModelByBlockComponent(element);
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

  private _onDrop = async (e: DragEvent) => {
    assertExists(e.dataTransfer);
    if (!e.dataTransfer.getData('affine/block-hub')) return;

    const page = this._editorHost.page;
    const point = this._indicator?.rect?.min ?? new Point(e.clientX, e.clientY);
    const lastModelState = this._lastDroppingTarget;
    const lastType = this._lastDroppingType;
    const dataTransfer = e.dataTransfer;
    assertExists(dataTransfer);

    const data = dataTransfer.getData('affine/block-hub');
    const models = [];
    const props = JSON.parse(data);
    const isDatabase = props.flavour === 'affine:database';

    // TO DO: fix image loading state for block hub
    if (
      props.flavour === 'affine:image' &&
      props.type === 'image' &&
      lastModelState &&
      lastType !== 'none' &&
      lastType !== 'database'
    ) {
      const imageFiles = await getImageFilesFromLocal();

      const imageService = this._editorHost.spec.getService('affine:image');
      assertExists(imageService);
      assertInstanceOf(imageService, ImageService);
      const maxFileSize = imageService.maxFileSize;

      addSiblingImageBlock(
        this._editorHost,
        imageFiles,
        maxFileSize,
        lastModelState.model
      );
    } else if (props.flavour === 'affine:bookmark') {
      if (lastModelState && lastType !== 'none' && lastType !== 'database') {
        const model = lastModelState.model;
        const parentModel = page.getParent(model);
        assertExists(parentModel);

        const index =
          parentModel.children.indexOf(model) + (lastType === 'after' ? 1 : 0);
        await toggleEmbedCardCreateModal(
          this._editorHost,
          'Links',
          'The added link will be displayed as a card view.',
          {
            mode: 'page',
            parentModel,
            index,
          }
        );
      }
    } else {
      models.push(props);
    }

    // In some cases, like cancel bookmark initial modal, there will be no models.
    if (!models.length) return;

    let parentModel;
    let focusId;
    if (lastModelState && lastType !== 'none') {
      const { model } = lastModelState;

      page.captureSync();

      if (lastType === 'database') {
        const ids = page.addBlocks(models, model);
        focusId = ids[0];
        parentModel = model;
      } else {
        const parent = page.getParent(model);
        assertExists(parent);
        const ids = page.addSiblingBlocks(model, models, lastType);
        focusId = ids[0];
        parentModel = parent;
      }

      // database init basic structure
      if (isDatabase) {
        const service = this._pageBlockElement.std.spec?.getService(
          'affine:database'
        ) as DatabaseService;
        service.initDatabaseBlock(page, model, model.id, 'table');
      }
    }

    if (isInsideDocEditor(this._editorHost)) {
      if (focusId) {
        asyncFocusRichText(this._editorHost, page, focusId)?.catch(
          console.error
        );
      }
      return;
    }

    // In edgeless mode.
    const pageBlockElement = this
      ._pageBlockElement as EdgelessPageBlockComponent;

    let noteId;
    if (focusId && parentModel) {
      const targetNoteBlock = this._editorHost.view.viewFromPath(
        'block',
        buildPath(parentModel)
      );
      assertExists(targetNoteBlock);
      noteId = targetNoteBlock.model.id;
    } else {
      // Creates new note block on blank area.
      const result = pageBlockElement.addNewNote(
        models,
        point,
        isDatabase ? { width: 752 } : undefined
      );
      noteId = result.noteId;
      focusId = result.ids[0];
      const model = page.getBlockById(focusId);
      assertExists(model);
      if (isDatabase) {
        const service = pageBlockElement.std.spec?.getService(
          'affine:database'
        ) as DatabaseService;
        service.initDatabaseBlock(page, model, model.id, 'table');
      }
    }
    pageBlockElement.setSelection(noteId, true, focusId, point);
  };

  private _onClickCard = async (
    _: MouseEvent,
    blockHubElement: HTMLElement
  ) => {
    const affineType = blockHubElement.getAttribute('affine-type');
    assertExists(affineType);
    const data: {
      flavour: string;
      type?: string;
    } = {
      flavour: blockHubElement.getAttribute('affine-flavour') ?? '',
      type: affineType ?? undefined,
    };
    const page = this._editorHost.page;
    const models = [];

    const defaultNoteBlock =
      page.root?.children.findLast(block => block.flavour === 'affine:note') ??
      page.addBlock('affine:note', {}, page.root?.id);

    // add to end
    let lastId;

    // TO DO: fix image loading state for blockhub
    if (data.flavour === 'affine:image' && data.type === 'image') {
      const imageFiles = await getImageFilesFromLocal();

      const imageService = this._editorHost.spec.getService('affine:image');
      assertExists(imageService);
      assertInstanceOf(imageService, ImageService);
      const maxFileSize = imageService.maxFileSize;

      const blockIds = addImageBlocks(
        this._editorHost,
        imageFiles,
        maxFileSize,
        page,
        defaultNoteBlock
      );

      lastId = blockIds[blockIds.length - 1];
    } else if (data.flavour === 'affine:bookmark') {
      await toggleEmbedCardCreateModal(
        this._editorHost,
        'Links',
        'The added link will be displayed as a card view.',
        {
          mode: 'page',
          parentModel: defaultNoteBlock,
        }
      );
    } else {
      models.push(data);
    }

    models.forEach(model => {
      lastId = page.addBlock(
        model.flavour ?? 'affine:paragraph',
        model,
        defaultNoteBlock
      );
    });
    lastId && (await asyncFocusRichText(this._editorHost, page, lastId));
  };

  private _onClickOutside = (e: MouseEvent) => {
    const target = e.target;
    if (target instanceof HTMLElement && !target.closest('affine-block-hub')) {
      this._hideCardList();
    }
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

    const classes = classMap({
      'icon-expanded': this._expanded,
      'new-icon-in-edgeless':
        !isInsideDocEditor(this._editorHost) && !this._expanded,
      'new-icon': true,
    });

    return html`
      <div
        class="block-hub-menu-container blocksuite-overlay"
        @pointerdown=${stopPropagation}
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
      </div>
    `;
  }
}
