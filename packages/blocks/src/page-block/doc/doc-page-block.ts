import { PathFinder, type PointerEventState } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Viewport } from '../../_common/utils/index.js';
import {
  asyncFocusRichText,
  getDocTitleInlineEditor,
  matchFlavours,
  NoteDisplayMode,
} from '../../_common/utils/index.js';
import type { NoteBlockModel } from '../../note-block/index.js';
import { PageClipboard } from '../clipboard/index.js';
import type { DocPageBlockWidgetName } from '../index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';
import type { PageBlockModel } from '../page-model.js';
import type { DocPageService } from './doc-page-service.js';

const PAGE_BLOCK_CHILD_PADDING = 24;

function testClickOnBlankArea(
  state: PointerEventState,
  viewportLeft: number,
  viewportWidth: number,
  pageWidth: number,
  paddingLeft: number,
  paddingRight: number
) {
  const blankLeft =
    viewportLeft + (viewportWidth - pageWidth) / 2 + paddingLeft;
  const blankRight =
    viewportLeft + (viewportWidth - pageWidth) / 2 + pageWidth - paddingRight;

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
    @container viewport (width <= 640px) {
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

  clipboardController = new PageClipboard(this);

  @query('.affine-doc-page-block-container')
  pageBlockContainer!: HTMLDivElement;

  private _viewportElement: HTMLDivElement | null = null;

  get slots() {
    return this.service.slots;
  }

  get viewportElement(): HTMLDivElement {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      '.affine-doc-viewport'
    ) as HTMLDivElement | null;
    assertExists(this._viewportElement);
    return this._viewportElement;
  }

  get viewport(): Viewport {
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
    this.host.event.activate();
    asyncFocusRichText(this.host, this.page, newFirstParagraphId)?.catch(
      console.error
    );
  };

  focusFirstParagraph = () => {
    const defaultNote = this._getDefaultNoteBlock();
    const firstText = defaultNote?.children.find(block =>
      matchFlavours(block, ['affine:paragraph', 'affine:list', 'affine:code'])
    );
    if (firstText) {
      asyncFocusRichText(this.host, this.page, firstText.id)?.catch(
        console.error
      );
    } else {
      const newFirstParagraphId = this.page.addBlock(
        'affine:paragraph',
        {},
        defaultNote,
        0
      );
      asyncFocusRichText(this.host, this.page, newFirstParagraphId)?.catch(
        console.error
      );
    }
  };

  override firstUpdated() {
    this._initViewportResizeEffect();
    const noteModels = this.model.children.filter(model =>
      matchFlavours(model, ['affine:note'])
    );
    noteModels.forEach(note => {
      this.disposables.add(
        note.propsUpdated.on(({ key }) => {
          if (key === 'displayMode') {
            this.requestUpdate();
          }
        })
      );
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();

    this.keyboardManager = new PageKeyboardManager(this);

    this.bindHotKey({
      ArrowUp: () => {
        const view = this.host.view;
        const selection = this.host.selection;
        const sel = selection.value.find(
          sel => sel.is('text') || sel.is('block')
        );
        if (!sel) return;
        const focusNote = view.findPrev(
          sel.path,
          (nodeView, _index, parent) => {
            if (nodeView.type === 'block' && parent.view === this) {
              return true;
            }
            return;
          }
        );
        if (!focusNote) return;
        const notes = this.childBlockElements.filter(
          el => el.model.flavour === 'affine:note'
        );
        const index = notes.indexOf(focusNote.view as BlockElement);
        if (index !== 0) return;

        const firstNoteChild = focusNote.children[0];
        if (
          !firstNoteChild ||
          !PathFinder.equals(firstNoteChild.path, sel.path)
        )
          return;

        const range = this.host.rangeManager?.value;
        requestAnimationFrame(() => {
          const currentRange = this.host.rangeManager?.value;

          if (!range || !currentRange) return;

          // If the range has not changed, it means we need to manually move the cursor to the title.
          if (
            range.startContainer === currentRange.startContainer &&
            range.startOffset === currentRange.startOffset &&
            range.endContainer === currentRange.endContainer &&
            range.endOffset === currentRange.endOffset
          ) {
            const titleInlineEditor = getDocTitleInlineEditor(this.host);
            if (titleInlineEditor) {
              titleInlineEditor.focusEnd();
            }
          }
        });
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
        this.viewport.left,
        this.viewport.clientWidth,
        this.pageBlockContainer.clientWidth,
        parseFloat(paddingLeft),
        parseFloat(paddingRight)
      );
      if (isClickOnBlankArea) {
        this.host.selection.clear(['block']);
        return;
      }

      let newTextSelectionPath: string[] | null = null;
      const readonly = this.model.page.readonly;
      const lastNote = this.model.children
        .slice()
        .reverse()
        .find(child => {
          const isNote = matchFlavours(child, ['affine:note']);
          if (!isNote) return false;
          const note = child as NoteBlockModel;
          const displayOnDoc =
            !!note.displayMode &&
            note.displayMode !== NoteDisplayMode.EdgelessOnly;
          return displayOnDoc;
        });
      if (!lastNote) {
        if (readonly) return;
        const noteId = this.page.addBlock('affine:note', {}, this.model.id);
        const paragraphId = this.page.addBlock('affine:paragraph', {}, noteId);
        newTextSelectionPath = [this.model.id, noteId, paragraphId];
      } else {
        const last = lastNote.children.at(-1);
        if (
          !last ||
          !last.text ||
          matchFlavours(last, [
            'affine:code',
            'affine:divider',
            'affine:image',
            'affine:database',
            'affine:bookmark',
            'affine:attachment',
            'affine:surface-ref',
          ]) ||
          /affine:embed-*/.test(last.flavour)
        ) {
          if (readonly) return;
          const paragraphId = this.page.addBlock(
            'affine:paragraph',
            {},
            lastNote.id
          );
          newTextSelectionPath = [this.model.id, lastNote.id, paragraphId];
        }
      }

      this.updateComplete
        .then(() => {
          if (!newTextSelectionPath) return;
          this.host.selection.setGroup('note', [
            this.host.selection.create('text', {
              from: {
                path: newTextSelectionPath,
                index: 0,
                length: 0,
              },
              to: null,
            }),
          ]);
        })
        .catch(console.error);
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboardController.hostDisconnected();
    this._disposables.dispose();
    this.keyboardManager = null;
  }

  override renderBlock() {
    const content = html`${repeat(
      this.model.children.filter(child => {
        const isNote = matchFlavours(child, ['affine:note']);
        const note = child as NoteBlockModel;
        const displayOnEdgeless =
          !!note.displayMode &&
          note.displayMode === NoteDisplayMode.EdgelessOnly;
        // Should remove deprecated `hidden` property in the future
        return !(isNote && displayOnEdgeless);
      }),
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
