/// <reference types="vite/client" />
import './meta-data/meta-data.js';

import {
  BLOCK_ID_ATTR,
  PAGE_BLOCK_CHILD_PADDING,
  PAGE_BLOCK_PADDING_BOTTOM,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import {
  type BaseBlockModel,
  matchFlavours,
  Slot,
  Utils,
} from '@blocksuite/store';
import { VEditor } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { PageClipboard } from '../../__internal__/clipboard/index.js';
import type {
  BlockHost,
  EditingState,
  SelectionPosition,
} from '../../__internal__/index.js';
import {
  asyncFocusRichText,
  hotkey,
  HOTKEY_SCOPE_TYPE,
  Rect,
} from '../../__internal__/index.js';
import { getService, registerService } from '../../__internal__/service.js';
import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import type { DragHandle } from '../../components/index.js';
import { PageBlockService } from '../index.js';
import type { PageBlockModel } from '../page-model.js';
import { bindHotkeys, removeHotkeys } from '../utils/bind-hotkey.js';
import { tryUpdateNoteSize } from '../utils/index.js';
import { DraggingArea } from './components.js';
import type { DefaultPageService } from './default-page-service.js';
import { createDragHandle, getAllowSelectedBlocks } from './utils.js';

export interface DefaultSelectionSlots {
  draggingAreaUpdated: Slot<DOMRect | null>;
  selectedRectsUpdated: Slot<DOMRect[]>;
  /**
   * @deprecated
   */
  embedRectsUpdated: Slot<DOMRect[]>;
  /**
   * @deprecated
   */
  embedEditingStateUpdated: Slot<EditingState | null>;
}

@customElement('affine-default-page')
export class DefaultPageBlockComponent
  extends BlockElement<PageBlockModel, DefaultPageService>
  implements BlockHost
{
  static override styles = css`
    .affine-default-viewport {
      position: relative;
      overflow-x: hidden;
      overflow-y: auto;
      height: 100%;
    }

    .affine-default-page-block-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      max-width: var(--affine-editor-width);
      margin: 0 auto;
      /* cursor: crosshair; */
      cursor: default;
      padding-bottom: ${PAGE_BLOCK_PADDING_BOTTOM}px;

      /* Leave a place for drag-handle */
      padding-left: ${PAGE_BLOCK_CHILD_PADDING}px;
      padding-right: ${PAGE_BLOCK_CHILD_PADDING}px;
    }

    .affine-default-page-block-title {
      width: 100%;
      font-size: 40px;
      line-height: 50px;
      font-weight: 700;
      outline: none;
      resize: none;
      border: 0;
      font-family: inherit;
      color: inherit;
      cursor: text;
    }

    .affine-default-page-block-title-empty::before {
      content: 'Title';
      color: var(--affine-placeholder-color);
      position: absolute;
      opacity: 0.5;
    }

    .affine-default-page-block-title:disabled {
      background-color: transparent;
    }

    /*
    .affine-default-page-block-title-container {
    }
    */

    .affine-block-element {
      display: block;
    }
  `;

  flavour = 'affine:page' as const;

  clipboard = new PageClipboard(this);

  getService = getService;

  lastSelectionPosition: SelectionPosition = 'start';

  /**
   * Shared components
   */
  components = {
    dragHandle: <DragHandle | null>null,
  };

  mouseRoot!: HTMLElement;

  get selection() {
    return this.service?.selection;
  }

  @state()
  private _draggingArea: DOMRect | null = null;

  @state()
  private _selectedRects: DOMRect[] = [];

  @state()
  private _isComposing = false;

  private _resizeObserver: ResizeObserver | null = null;

  @query('.affine-default-viewport')
  viewportElement!: HTMLDivElement;

  @query('.affine-default-page-block-container')
  pageBlockContainer!: HTMLDivElement;

  slots = {
    draggingAreaUpdated: new Slot<DOMRect | null>(),
    selectedRectsUpdated: new Slot<DOMRect[]>(),
    embedRectsUpdated: new Slot<DOMRect[]>(),
    embedEditingStateUpdated: new Slot<EditingState | null>(),
    pageLinkClicked: new Slot<{
      pageId: string;
      blockId?: string;
    }>(),
  };

  @query('.affine-default-page-block-title')
  private _titleContainer!: HTMLElement;
  private _titleVEditor: VEditor | null = null;

  get titleVEditor() {
    assertExists(this._titleVEditor);
    return this._titleVEditor;
  }

  get innerRect() {
    const { left, width } = this.pageBlockContainer.getBoundingClientRect();
    assertExists(this.selection);
    const { clientHeight, top } = this.selection.state.viewport;
    return Rect.fromLWTH(
      left,
      Math.min(width, window.innerWidth),
      top,
      Math.min(clientHeight, window.innerHeight)
    );
  }

  private _initTitleVEditor() {
    const { model } = this;
    const title = model.title;

    this._titleVEditor = new VEditor(title.yText, {
      active: () => activeEditorManager.isActive(this),
    });
    this._titleVEditor.mount(this._titleContainer);
    this._titleVEditor.bindHandlers({
      keydown: this._onTitleKeyDown,
      paste: this._onTitlePaste,
    });

    // Workaround for virgo skips composition event
    this._disposables.addFromEvent(
      this._titleContainer,
      'compositionstart',
      () => (this._isComposing = true)
    );
    this._disposables.addFromEvent(
      this._titleContainer,
      'compositionend',
      () => (this._isComposing = false)
    );

    this.model.title.yText.observe(() => {
      this._updateTitleInMeta();
      this.requestUpdate();
    });
    this._titleVEditor.setReadonly(this.page.readonly);
  }

  private _updateTitleInMeta = () => {
    this.page.workspace.setPageMeta(this.page.id, {
      title: this.model.title.toString(),
    });
  };

  private _onTitleKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing || this.page.readonly) return;
    const hasContent = !this.page.isEmpty;
    const { page, model } = this;
    const defaultNote = model.children.find(
      child => child.flavour === 'affine:note'
    );

    if (e.key === 'Enter' && hasContent) {
      e.preventDefault();
      assertExists(this._titleVEditor);
      const vRange = this._titleVEditor.getVRange();
      assertExists(vRange);
      const right = model.title.split(vRange.index);
      const newFirstParagraphId = page.addBlock(
        'affine:paragraph',
        { text: right },
        defaultNote,
        0
      );
      asyncFocusRichText(page, newFirstParagraphId);
      return;
    } else if (e.key === 'ArrowDown' && hasContent) {
      e.preventDefault();
      const firstText = defaultNote?.children.find(block =>
        matchFlavours(block, ['affine:paragraph', 'affine:list', 'affine:code'])
      );
      if (firstText) {
        asyncFocusRichText(page, firstText.id);
      } else {
        const newFirstParagraphId = page.addBlock(
          'affine:paragraph',
          {},
          defaultNote,
          0
        );
        asyncFocusRichText(page, newFirstParagraphId);
      }
      return;
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  private _onTitlePaste = (event: ClipboardEvent) => {
    const vEditor = this._titleVEditor;
    if (!vEditor) return;
    const vRange = vEditor.getVRange();
    if (!vRange) return;

    const data = event.clipboardData?.getData('text/plain');
    if (data) {
      const text = data.replace(/(\r\n|\r|\n)/g, '\n');
      vEditor.insertText(vRange, text);
      vEditor.setVRange({
        index: vRange.index + text.length,
        length: 0,
      });
    }
  };

  // TODO: disable it on scroll's threshold
  private _onWheel = (e: WheelEvent) => {
    assertExists(this.selection);
    const { selection } = this;
    const { state } = selection;
    const { type, viewport } = state;

    if (type === 'native') {
      return;
    }

    if (type.startsWith('block')) {
      e.preventDefault();
      const { viewportElement } = this;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const max = scrollHeight - clientHeight;
      let top = e.deltaY / 2;
      if (top > 0) {
        if (Math.ceil(scrollTop) === max) return;

        top = Math.min(top, max - scrollTop);
      } else if (top < 0) {
        if (scrollTop === 0) return;

        top = Math.max(top, -scrollTop);
      }

      viewport.scrollTop += top;
      // FIXME: need smooth
      viewportElement.scrollTop += top;

      if (type === 'block') {
        const { draggingArea } = state;
        if (draggingArea) {
          draggingArea.end.y += top;
          selection.updateDraggingArea(draggingArea);
        }
      }
    }

    // trigger native scroll
  };

  private _onScroll = (e: Event) => {
    assertExists(this.selection);
    const { selection } = this;
    const { type, viewport } = selection.state;
    const { scrollLeft, scrollTop } = e.target as Element;
    viewport.scrollLeft = scrollLeft;
    viewport.scrollTop = scrollTop;

    if (type === 'block') {
      selection.refreshDraggingArea(selection.state.viewportOffset);
      return;
    }

    let point;

    if (type === 'native') {
      point = selection.state.startRange && selection.state.lastPoint;
    } else if (type === 'block:drag') {
      point = selection.state.lastPoint;
    }

    if (point) {
      // Create a synthetic `pointermove` PointerEvent
      const evt = new PointerEvent('pointermove', {
        clientX: point.x,
        clientY: point.y,
      });
      document.dispatchEvent(evt);
    }
  };

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('model')) {
      if (this.model && !this._titleVEditor) {
        this._initTitleVEditor();
      }
    }
  }

  private _initDragHandle = () => {
    const createHandle = () => {
      this.components.dragHandle = createDragHandle(this);
      this.components.dragHandle.getDropAllowedBlocks = draggingBlockIds => {
        if (
          draggingBlockIds &&
          draggingBlockIds.length === 1 &&
          Utils.isInsideBlockByFlavour(
            this.page,
            draggingBlockIds[0],
            'affine:database'
          )
        ) {
          return getAllowSelectedBlocks(
            this.page.getParent(draggingBlockIds[0]) as BaseBlockModel
          );
        }

        if (!draggingBlockIds || draggingBlockIds.length === 1) {
          return getAllowSelectedBlocks(this.model);
        } else {
          return getAllowSelectedBlocks(this.model).filter(block => {
            return !draggingBlockIds?.includes(block.id);
          });
        }
      };
    };
    if (
      this.page.awarenessStore.getFlag('enable_drag_handle') &&
      !this.components.dragHandle
    ) {
      createHandle();
    }
    this._disposables.add(
      this.page.awarenessStore.slots.update.subscribe(
        msg => msg.state?.flags.enable_drag_handle,
        enable => {
          if (enable) {
            if (!this.components.dragHandle) {
              createHandle();
            }
          } else {
            this.components.dragHandle?.remove();
            this.components.dragHandle = null;
          }
        },
        {
          filter: msg => msg.id === this.page.doc.clientID,
        }
      )
    );
  };

  private _initSlotEffects() {
    const { slots } = this;

    this._disposables.add(
      slots.draggingAreaUpdated.on(rect => {
        this._draggingArea = rect;
      })
    );
    this._disposables.add(
      slots.selectedRectsUpdated.on(rects => {
        this._selectedRects = rects;
      })
    );
    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );
  }

  private _initNoteSizeEffect() {
    tryUpdateNoteSize(this.page, 1);
    this.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      tryUpdateNoteSize(this.page, 1);
    });
  }

  private _initResizeEffect() {
    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === this.viewportElement) {
            this.selection?.updateViewport();
            this.selection?.updateRects();
            break;
          }
        }
      }
    );
    resizeObserver.observe(this.viewportElement);
    this._resizeObserver = resizeObserver;
  }

  override firstUpdated() {
    const { page, selection } = this;
    const scope = hotkey.newScope(HOTKEY_SCOPE_TYPE.AFFINE_PAGE);
    if (activeEditorManager.isActive(this)) {
      hotkey.setScope(scope);
    }
    this._disposables.add(
      activeEditorManager.activeSlot.on(() => {
        if (activeEditorManager.isActive(this)) {
          hotkey.setScope(scope);
        }
      })
    );
    this._disposables.add(() => hotkey.deleteScope(scope));
    hotkey.withScope(scope, () => {
      assertExists(selection);
      bindHotkeys(page, selection);
    });
    hotkey.enableHotkey();

    this._initDragHandle();
    this._initSlotEffects();
    this._initNoteSizeEffect();
    this._initResizeEffect();

    this.mouseRoot.addEventListener('wheel', this._onWheel);
    this.viewportElement.addEventListener('scroll', this._onScroll);

    this.setAttribute(BLOCK_ID_ATTR, this.model.id);
  }

  override connectedCallback() {
    super.connectedCallback();
    registerService('affine:page', PageBlockService);
    this.clipboard.init(this.page);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mouseRoot = this.parentElement!;
    this.service?.mountSelectionManager(this, this.slots);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboard.dispose();
    this._disposables.dispose();
    this.components.dragHandle?.remove();

    removeHotkeys();
    this.service?.unmountSelectionManager();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.mouseRoot.removeEventListener('wheel', this._onWheel);
    this.viewportElement.removeEventListener('scroll', this._onScroll);
    this._disposables.dispose();
  }

  override render() {
    requestAnimationFrame(() => {
      this.service?.selection?.refreshRemoteSelection();
    });

    const { selection } = this;
    const viewportOffset = selection?.state.viewportOffset;

    const draggingArea = DraggingArea(this._draggingArea);
    const isEmpty =
      (!this.model.title || !this.model.title.length) && !this._isComposing;

    const content = html`${repeat(
      this.model?.children.filter(
        child => !(matchFlavours(child, ['affine:note']) && child.hidden)
      ),
      child => child.id,
      child => this.root.renderModel(child)
    )}`;

    return html`
      <div class="affine-default-viewport">
        <div class="affine-default-page-block-container">
          <div class="affine-default-page-block-title-container">
            <div
              data-block-is-title="true"
              class="affine-default-page-block-title ${isEmpty
                ? 'affine-default-page-block-title-empty'
                : ''}"
            ></div>
            <affine-page-meta-data
              .host="${this}"
              .page="${this.page}"
            ></affine-page-meta-data>
          </div>
          ${content}
        </div>
        <affine-selected-blocks
          .mouseRoot="${this.mouseRoot}"
          .state="${{
            rects: this._selectedRects,
            grab: !draggingArea,
          }}"
          .offset="${viewportOffset}"
        ></affine-selected-blocks>
        ${this.widgets} ${draggingArea}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-default-page': DefaultPageBlockComponent;
  }
}
