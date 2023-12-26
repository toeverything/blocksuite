import type { PointerEventState } from '@blocksuite/block-std';
import { assertExists, Slot } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { EditingState } from '../../_common/utils/index.js';
import {
  asyncFocusRichText,
  getDocTitleInlineEditor,
  matchFlavours,
} from '../../_common/utils/index.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import { PageClipboard } from '../clipboard/index.js';
import type { DocPageBlockWidgetName } from '../index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import type { PageBlockModel } from '../page-model.js';
import { Gesture } from '../text-selection/gesture.js';
import { pageRangeSyncFilter } from '../text-selection/sync-filter.js';
import type { DocPageService } from './doc-page-service.js';

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

const PAGE_BLOCK_CHILD_PADDING = 24;

function testClickOnBlankArea(
  state: PointerEventState,
  viewportWidth: number,
  pageWidth: number,
  paddingLeft: number,
  paddingRight: number
) {
  const blankLeft = (viewportWidth - pageWidth) / 2 + paddingLeft;
  const blankRight = (viewportWidth - pageWidth) / 2 + pageWidth - paddingRight;

  if (state.raw.clientX < blankLeft || state.raw.clientX > blankRight) {
    return true;
  }

  return false;
}

@customElement('affine-doc-page')
export class DocPageBlockComponent extends BlockElement<
  PageBlockModel,
  DocPageService,
  DocPageBlockWidgetName
> {
  static override styles = css`
    .affine-doc-page-block-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      max-width: var(--affine-editor-width);
      margin: 0 auto;
      /* cursor: crosshair; */
      cursor: default;

      /* Leave a place for drag-handle */
      /* Do not use prettier format this style, or it will be broken */
      /* prettier-ignore */
      padding-left: var(--affine-editor-side-padding, ${PAGE_BLOCK_CHILD_PADDING}px);
      /* prettier-ignore */
      padding-right: var(--affine-editor-side-padding, ${PAGE_BLOCK_CHILD_PADDING}px);
    }

    /* Extra small devices (phones, 640px and down) */
    @media screen and (max-width: 640px) {
      .affine-doc-page-block-container {
        padding-left: ${PAGE_BLOCK_CHILD_PADDING}px;
        padding-right: ${PAGE_BLOCK_CHILD_PADDING}px;
      }
    }

    .affine-block-element {
      display: block;
    }

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  keyboardManager: PageKeyboardManager | null = null;

  gesture: Gesture | null = null;

  clipboardController = new PageClipboard(this);

  @query('.affine-doc-page-block-container')
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
    tagClicked: new Slot<{
      tagId: string;
    }>(),
    viewportUpdated: new Slot<PageViewport>(),
  };

  get viewportElement(): HTMLDivElement {
    const viewportElement = this.host.closest(
      '.affine-doc-viewport'
    ) as HTMLDivElement | null;
    assertExists(viewportElement);
    return viewportElement;
  }

  get viewport(): PageViewport {
    if (!this.viewportElement) {
      return {
        left: 0,
        top: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        clientWidth: 0,
        clientHeight: 0,
      };
    }

    const {
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    } = this.viewportElement;
    const { top, left } = this.viewportElement.getBoundingClientRect();
    return {
      top,
      left,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    };
  }

  private _createDefaultNoteBlock() {
    const { page } = this;

    const noteId = page.addBlock('affine:note', {}, page.root?.id);
    return page.getBlockById(noteId);
  }

  private _getDefaultNoteBlock() {
    return (
      this.page.root?.children.find(child => child.flavour === 'affine:note') ??
      this._createDefaultNoteBlock()
    );
  }

  private _initViewportResizeEffect() {
    // when observe viewportElement resize, emit viewport update event
    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === this.viewportElement) {
            this.slots.viewportUpdated.emit(this.viewport);
            break;
          }
        }
      }
    );
    resizeObserver.observe(this.viewportElement);
  }

  prependParagraphWithText = (text: Text) => {
    const newFirstParagraphId = this.page.addBlock(
      'affine:paragraph',
      { text },
      this._getDefaultNoteBlock(),
      0
    );
    asyncFocusRichText(this.page, newFirstParagraphId)?.catch(console.error);
  };

  focusFirstParagraph = () => {
    const defaultNote = this._getDefaultNoteBlock();
    const firstText = defaultNote?.children.find(block =>
      matchFlavours(block, ['affine:paragraph', 'affine:list', 'affine:code'])
    );
    if (firstText) {
      asyncFocusRichText(this.page, firstText.id)?.catch(console.error);
    } else {
      const newFirstParagraphId = this.page.addBlock(
        'affine:paragraph',
        {},
        defaultNote,
        0
      );
      asyncFocusRichText(this.page, newFirstParagraphId)?.catch(console.error);
    }
  };

  override firstUpdated() {
    this._initViewportResizeEffect();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();

    this.host.rangeManager?.rangeSynchronizer.setFilter(pageRangeSyncFilter);

    this.gesture = new Gesture(this);
    this.keyboardManager = new PageKeyboardManager(this);

    this.bindHotKey({
      ArrowUp: () => {
        const view = this.host.view;
        const selection = this.host.selection;
        const sel = selection.value.find(
          sel => sel.is('text') || sel.is('block')
        );
        if (!sel) return;
        const focus = view.findPrev(sel.path, (nodeView, _index, parent) => {
          if (nodeView.type === 'block' && parent.view === this) {
            return true;
          }
          return;
        });
        if (!focus) return;
        const notes = this.childBlockElements.filter(
          el => el.model.flavour === 'affine:note'
        );
        const index = notes.indexOf(focus.view as BlockElement);
        if (index !== 0) {
          const prev = notes[index - 1];
          const lastNoteChild = sel.is('text')
            ? prev.childBlockElements.reverse().find(el => !!el.model.text)
            : prev.childBlockElements.at(-1);
          if (!lastNoteChild) return;
          selection.update(selList =>
            selList
              .filter(sel => !sel.is('text') && !sel.is('block'))
              .concat([
                sel.is('text')
                  ? selection.create('text', {
                      from: {
                        path: lastNoteChild.path,
                        index: lastNoteChild.model.text?.length ?? 0,
                        length: 0,
                      },
                      to: null,
                    })
                  : selection.create('block', {
                      path: lastNoteChild.path,
                    }),
              ])
          );
          return true;
        } else {
          const titleInlineEditor = getDocTitleInlineEditor(this.host);
          if (titleInlineEditor) {
            titleInlineEditor.focusEnd();
            return true;
          }
          return;
        }
      },
      ArrowDown: () => {
        const view = this.host.view;
        const selection = this.host.selection;
        const sel = selection.value.find(
          sel => sel.is('text') || sel.is('block')
        );
        if (!sel) return;
        const focus = view.findPrev(sel.path, (nodeView, _index, parent) => {
          if (nodeView.type === 'block' && parent.view === this) {
            return true;
          }
          return;
        });
        if (!focus) return;
        const notes = this.childBlockElements.filter(
          el => el.model.flavour === 'affine:note'
        );
        const index = notes.indexOf(focus.view as BlockElement);
        if (index < notes.length - 1) {
          const prev = notes[index + 1];
          const firstNoteChild = sel.is('text')
            ? prev.childBlockElements.find(x => !!x.model.text)
            : prev.childBlockElements.at(0);
          if (!firstNoteChild) return;
          selection.update(selList =>
            selList
              .filter(sel => !sel.is('text') && !sel.is('block'))
              .concat([
                sel.is('text')
                  ? selection.create('text', {
                      from: {
                        path: firstNoteChild.path,
                        index: 0,
                        length: 0,
                      },
                      to: null,
                    })
                  : selection.create('block', {
                      path: firstNoteChild.path,
                    }),
              ])
          );
          return true;
        }
        return;
      },
    });

    this.handleEvent('click', ctx => {
      const event = ctx.get('pointerState');
      if (
        event.raw.target !== this &&
        event.raw.target !== this.viewportElement &&
        event.raw.target !== this.pageBlockContainer
      ) {
        return;
      }

      const { paddingLeft, paddingRight } = window.getComputedStyle(
        this.pageBlockContainer
      );
      const isClickOnBlankArea = testClickOnBlankArea(
        event,
        this.viewport.clientWidth,
        this.pageBlockContainer.clientWidth,
        parseFloat(paddingLeft),
        parseFloat(paddingRight)
      );
      if (isClickOnBlankArea) return;

      let noteId: string;
      let paragraphId: string;
      let index = 0;
      const readonly = this.model.page.readonly;
      const lastNote = this.model.children
        .slice()
        .reverse()
        .find(
          child =>
            child.flavour === 'affine:note' && !(child as NoteBlockModel).hidden
        );
      if (!lastNote) {
        if (readonly) return;
        noteId = this.page.addBlock('affine:note', {}, this.model.id);
        paragraphId = this.page.addBlock('affine:paragraph', {}, noteId);
      } else {
        noteId = lastNote.id;
        const last = lastNote.children.at(-1);
        if (
          !last ||
          matchFlavours(last, [
            'affine:code',
            'affine:divider',
            'affine:image',
            'affine:database',
            'affine:bookmark',
            'affine:attachment',
            'affine:surface-ref',
          ])
        ) {
          if (readonly) return;
          paragraphId = this.page.addBlock('affine:paragraph', {}, noteId);
        } else {
          paragraphId = last.id;
          index = last.text?.length ?? 0;
        }
      }

      requestAnimationFrame(() => {
        this.host.selection.setGroup('note', [
          this.host.selection.create('text', {
            from: {
              path: [this.model.id, noteId, paragraphId],
              index,
              length: 0,
            },
            to: null,
          }),
        ]);
      });
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    this._disposables.dispose();
    this.gesture = null;
    this.keyboardManager = null;
  }

  override render() {
    const content = html`${repeat(
      this.model.children.filter(
        child => !(matchFlavours(child, ['affine:note']) && child.hidden)
      ),
      child => child.id,
      child => this.renderModel(child)
    )}`;

    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    return html`
      <div class="affine-doc-page-block-container">${content} ${widgets}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-doc-page': DocPageBlockComponent;
  }
}
