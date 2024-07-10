import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { IS_FIREFOX } from '@blocksuite/global/env';
import { assertExists } from '@blocksuite/global/utils';
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
  getEdgelessRootByEditorHost,
  getHoveringNote,
  getImageFilesFromLocal,
  getModelByBlockComponent,
  getPageRootByEditorHost,
  isInsidePageEditor,
  Point,
  Rect,
  stopPropagation,
} from '../../../../_common/utils/index.js';
import { viewPresets } from '../../../../database-block/data-view/index.js';
import {
  addImageBlocks,
  addSiblingImageBlock,
} from '../../../../image-block/utils.js';
import type { EdgelessRootBlockComponent } from '../../../../root-block/edgeless/edgeless-root-block.js';
import { PageRootBlockComponent } from '../../../../root-block/page/page-root-block.js';
import { autoScroll } from '../../../../root-block/text-selection/utils.js';
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
  private get _rootElement() {
    const rootElement = isInsidePageEditor(this._editorHost)
      ? (getPageRootByEditorHost(this._editorHost) as PageRootBlockComponent)
      : (getEdgelessRootByEditorHost(
          this._editorHost
        ) as EdgelessRootBlockComponent);
    return rootElement;
  }

  static override styles = styles;

  /**
   * A function that returns all blocks that are allowed to be moved to
   */
  @state()
  private accessor _expanded = false;

  @state()
  private accessor _isGrabbing = false;

  @state()
  private accessor _visibleCardType: CardListType | null = null;

  @state()
  private accessor _showTooltip = true;

  @state()
  private accessor _maxHeight = 2000;

  @queryAll('.card-container')
  private accessor _blockHubCards!: NodeList & HTMLElement[];

  @queryAll('.block-hub-icon-container[type]')
  private accessor _blockHubMenus!: NodeList & HTMLElement[];

  @query('.new-icon')
  private accessor _blockHubButton!: HTMLElement;

  @query('.block-hub-icons-container')
  private accessor _blockHubIconsContainer!: HTMLElement;

  @query('.block-hub-menu-container')
  private accessor _blockHubMenuContainer!: HTMLElement;

  @query('[role="menuitem"]')
  private accessor _blockHubMenuEntry!: HTMLElement;

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

  constructor(host: EditorHost) {
    super();
    this._editorHost = host;
  }

  private _getHoveringNoteState = (point: Point) => {
    const state = {
      scale: 1,
    } as {
      container?: Element;
      rect?: Rect;
      scale: number;
    };

    if (isInsidePageEditor(this._editorHost)) {
      const closestNoteBlock = getClosestNoteBlock(
        this._editorHost,
        this._rootElement,
        point
      );
      if (closestNoteBlock) {
        state.rect = Rect.fromDOMRect(closestNoteBlock.getBoundingClientRect());
      }
    } else {
      state.scale = (
        this._rootElement as EdgelessRootBlockComponent
      ).service.viewport.zoom;
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
    this._rootElement.selection.clear();
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
        const lastBlock = this._rootElement.model.lastChild();
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
      if (this._rootElement instanceof PageRootBlockComponent) {
        const result = autoScroll(
          this._rootElement.rootScrollContainer,
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

    const doc = this._editorHost.doc;
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
        const parentModel = doc.getParent(model);
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

      doc.captureSync();

      if (lastType === 'database') {
        const ids = doc.addBlocks(models, model);
        focusId = ids[0];
        parentModel = model;
      } else {
        const parent = doc.getParent(model);
        assertExists(parent);
        const ids = doc.addSiblingBlocks(model, models, lastType);
        focusId = ids[0];
        parentModel = parent;
      }

      // database init basic structure
      if (isDatabase) {
        const service =
          this._rootElement.std.spec?.getService('affine:database');
        service.initDatabaseBlock(
          doc,
          model,
          model.id,
          viewPresets.tableViewConfig
        );
      }
    }

    if (isInsidePageEditor(this._editorHost)) {
      if (focusId) {
        asyncFocusRichText(this._editorHost, focusId)?.catch(console.error);
      }
      return;
    }

    // In edgeless mode.
    const rootElement = this._rootElement as EdgelessRootBlockComponent;

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
      const result = rootElement.addNewNote(
        models,
        point,
        isDatabase ? { width: 752 } : undefined
      );
      noteId = result.noteId;
      focusId = result.ids[0];
      const model = doc.getBlockById(focusId);
      assertExists(model);
      if (isDatabase) {
        const service = rootElement.std.spec?.getService('affine:database');
        service.initDatabaseBlock(
          doc,
          model,
          model.id,
          viewPresets.kanbanViewConfig
        );
      }
    }
    rootElement.setSelection(noteId, true, focusId, point);
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
    const doc = this._editorHost.doc;
    const models = [];

    const defaultNoteBlock =
      doc.root?.children.findLast(block => block.flavour === 'affine:note') ??
      doc.addBlock('affine:note', {}, doc.root?.id);

    // add to end
    let lastId;

    // TO DO: fix image loading state for blockhub
    if (data.flavour === 'affine:image' && data.type === 'image') {
      const imageFiles = await getImageFilesFromLocal();

      const imageService = this._editorHost.spec.getService('affine:image');
      const maxFileSize = imageService.maxFileSize;

      const blockIds = addImageBlocks(
        this._editorHost,
        imageFiles,
        maxFileSize,
        defaultNoteBlock
      );

      lastId = blockIds?.[blockIds.length - 1];
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
      lastId = doc.addBlock(
        (model.flavour ?? 'affine:paragraph') as never,
        model,
        defaultNoteBlock
      );
    });
    lastId && (await asyncFocusRichText(this._editorHost, lastId));
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
    this._blockHubCards.forEach((card: HTMLElement) => {
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

    this._indicator = document.querySelector(
      'affine-drag-indicator'
    ) as DragIndicator;
    if (!this._indicator) {
      this._indicator = document.createElement(
        'affine-drag-indicator'
      ) as DragIndicator;
      document.body.append(this._indicator);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposables.dispose();
  }

  toggleMenu() {
    this._expanded = !this._expanded;
    if (!this._expanded) this._hideCardList();
  }

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
        !isInsidePageEditor(this._editorHost) && !this._expanded,
      'new-icon': true,
    });

    return html`
      <div
        class="block-hub-menu-container"
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
