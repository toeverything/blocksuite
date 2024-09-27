import type { NoteBlockModel, RootBlockModel } from '@blocksuite/affine-model';
import type { Viewport } from '@blocksuite/affine-shared/types';
import type { BlockModel, Text } from '@blocksuite/store';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { NoteDisplayMode } from '@blocksuite/affine-model';
import {
  focusTitle,
  getDocTitleInlineEditor,
  getScrollContainer,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { BLOCK_ID_ATTR, BlockComponent } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { PageRootBlockWidgetName } from '../index.js';
import type { PageRootService } from './page-root-service.js';

import { buildPath } from '../../_common/utils/index.js';
import { PageClipboard } from '../clipboard/index.js';
import { PageKeyboardManager } from '../keyboard/keyboard-manager.js';

const DOC_BLOCK_CHILD_PADDING = 24;
const DOC_BOTTOM_PADDING = 32;

export class PageRootBlockComponent extends BlockComponent<
  RootBlockModel,
  PageRootService,
  PageRootBlockWidgetName
> {
  static override styles = css`
    editor-host:has(> affine-page-root, * > affine-page-root) {
      display: block;
      height: 100%;
    }

    affine-page-root {
      display: grid;
      height: 100%;
      justify-content: center;
    }

    .affine-page-root-block-container {
      display: grid;
      /* prettier-ignore */
      grid-template-columns: minmax(var(--affine-editor-side-padding, ${DOC_BLOCK_CHILD_PADDING}px), 1fr) auto minmax(var(--affine-editor-side-padding, ${DOC_BLOCK_CHILD_PADDING}px), 1fr);
      grid-template-rows: 1fr auto;
      grid-template-areas:
        'left content right'
        'bottom bottom bottom';
      height: 100%;
      font-family: var(--affine-font-family);
      font-size: var(--affine-font-base);
      line-height: var(--affine-line-height);
      color: var(--affine-text-primary-color);
      font-weight: 400;
      max-width: var(--affine-editor-width);
      /* cursor: crosshair; */
      cursor: default;
    }

    .affine-page-root-left-blank {
      grid-area: left;
    }
    .affine-page-root-right-blank {
      grid-area: right;
    }
    .affine-page-root-content {
      grid-area: content;
    }

    .affine-page-root-bottom-blank {
      grid-area: bottom;
      height: var(--affine-editor-bottom-padding, ${DOC_BOTTOM_PADDING}px);
    }

    /* Extra small devices (phones, 640px and down) */
    @container viewport (width <= 640px) {
      .affine-page-root-block-container {
        /* prettier-ignore */
        grid-template-columns: ${DOC_BLOCK_CHILD_PADDING}px auto ${DOC_BLOCK_CHILD_PADDING}px;
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

  private _viewportElement: HTMLDivElement | null = null;

  clipboardController = new PageClipboard(this);

  focusFirstParagraph = () => {
    const defaultNote = this._getDefaultNoteBlock();
    const firstText = defaultNote?.children.find(block =>
      matchFlavours(block, ['affine:paragraph', 'affine:list', 'affine:code'])
    );
    if (firstText) {
      focusTextModel(this.std, firstText.id);
    } else {
      const newFirstParagraphId = this.doc.addBlock(
        'affine:paragraph',
        {},
        defaultNote,
        0
      );
      focusTextModel(this.std, newFirstParagraphId);
    }
  };

  keyboardManager: PageKeyboardManager | null = null;

  prependParagraphWithText = (text: Text) => {
    const newFirstParagraphId = this.doc.addBlock(
      'affine:paragraph',
      { text },
      this._getDefaultNoteBlock(),
      0
    );
    focusTextModel(this.std, newFirstParagraphId);
  };

  get rootScrollContainer() {
    return getScrollContainer(this);
  }

  get slots() {
    return this.service.slots;
  }

  get viewport(): Viewport | null {
    if (!this.viewportElement) {
      return null;
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

  get viewportElement(): HTMLDivElement | null {
    if (this._viewportElement) return this._viewportElement;
    this._viewportElement = this.host.closest(
      '.affine-page-viewport'
    ) as HTMLDivElement | null;
    return this._viewportElement;
  }

  private _createDefaultNoteBlock() {
    const { doc } = this;

    const noteId = doc.addBlock('affine:note', {}, doc.root?.id);
    return doc.getBlockById(noteId) as NoteBlockModel;
  }

  private _getDefaultNoteBlock() {
    return (
      this.doc.root?.children.find(child => child.flavour === 'affine:note') ??
      this._createDefaultNoteBlock()
    );
  }

  private _initViewportResizeEffect() {
    const viewport = this.viewport;
    const viewportElement = this.viewportElement;
    if (!viewport || !viewportElement) {
      return;
    }
    // when observe viewportElement resize, emit viewport update event
    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        for (const { target } of entries) {
          if (target === viewportElement) {
            this.slots.viewportUpdated.emit(viewport);
            break;
          }
        }
      }
    );
    resizeObserver.observe(viewportElement);
    this.disposables.add(() => {
      resizeObserver.unobserve(viewportElement);
      resizeObserver.disconnect();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clipboardController.hostConnected();

    this.keyboardManager = new PageKeyboardManager(this);

    this.bindHotKey({
      'Mod-a': () => {
        const blocks = this.model.children
          .filter(model => {
            if (matchFlavours(model, ['affine:note'])) {
              const note = model as NoteBlockModel;
              if (note.displayMode === NoteDisplayMode.EdgelessOnly)
                return false;

              return true;
            }
            return false;
          })
          .flatMap(model => {
            return model.children.map(child => {
              return this.std.selection.create('block', {
                blockId: child.id,
              });
            });
          });
        this.std.selection.setGroup('note', blocks);
        return true;
      },
      ArrowUp: () => {
        const selection = this.host.selection;
        const sel = selection.value.find(
          sel => sel.is('text') || sel.is('block')
        );
        if (!sel) return;
        let model: BlockModel | null = null;
        let path: string[] = buildPath(this.doc.getBlockById(sel.blockId));
        while (path.length > 0 && !model) {
          const m = this.doc.getBlockById(path[path.length - 1]);
          if (m && m.flavour === 'affine:note') {
            model = m;
          }
          path = path.slice(0, -1);
        }
        if (!model) return;
        const prevNote = this.doc.getPrev(model);
        if (!prevNote || prevNote.flavour !== 'affine:note') {
          const isFirstText = sel.is('text') && sel.start.index === 0;
          const isBlock = sel.is('block');
          if (isBlock || isFirstText) {
            focusTitle(this.host);
          }
          return;
        }
        const notes = this.doc.getBlockByFlavour('affine:note');
        const index = notes.indexOf(prevNote);
        if (index !== 0) return;

        const range = this.std.range.value;
        requestAnimationFrame(() => {
          const currentRange = this.std.range.value;

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

    const getBlockAreaHandler = (side: 'left' | 'right') => (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let blockComponent: BlockComponent | null | undefined = null;
      if (side === 'left') {
        const rect = this.leftBlankArea.getBoundingClientRect();
        let el = document.elementFromPoint(rect.right + 50, e.clientY);
        if (!el) {
          el = document.elementFromPoint(rect.right - 50, e.clientY - 10);
        }
        blockComponent = el?.closest(`[${BLOCK_ID_ATTR}]`);
      } else {
        const rect = this.rightBlankArea.getBoundingClientRect();
        let el = document.elementFromPoint(rect.left - 50, e.clientY);
        if (!el) {
          el = document.elementFromPoint(rect.left - 50, e.clientY - 10);
        }
        blockComponent = el?.closest(`[${BLOCK_ID_ATTR}]`);
      }

      this.selection.clear(['block', 'text']);

      if (blockComponent) {
        if (blockComponent.model.text) {
          if (side === 'left') {
            focusTextModel(this.std, blockComponent.model.id);
          } else {
            focusTextModel(
              this.std,
              blockComponent.model.id,
              blockComponent.model.text.length
            );
          }
        } else {
          this.selection.setGroup('note', [
            this.selection.create('block', {
              blockId: blockComponent.blockId,
            }),
          ]);
        }
      }
    };
    this.updateComplete
      .then(() => {
        this.disposables.addFromEvent(
          this.leftBlankArea,
          'click',
          getBlockAreaHandler('left')
        );
        this.disposables.addFromEvent(
          this.rightBlankArea,
          'click',
          getBlockAreaHandler('right')
        );
      })
      .catch(console.error);

    this.handleEvent('click', () => {
      let newTextSelectionId: string | null = null;
      const readonly = this.doc.readonly;
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
        const noteId = this.doc.addBlock('affine:note', {}, this.model.id);
        const paragraphId = this.doc.addBlock('affine:paragraph', {}, noteId);
        newTextSelectionId = paragraphId;
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
          const paragraphId = this.doc.addBlock(
            'affine:paragraph',
            {},
            lastNote.id
          );
          newTextSelectionId = paragraphId;
        }
      }

      this.updateComplete
        .then(() => {
          if (!newTextSelectionId) return;
          this.host.selection.setGroup('note', [
            this.host.selection.create('text', {
              from: {
                blockId: newTextSelectionId,
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

  override renderBlock() {
    const widgets = html`${repeat(
      Object.entries(this.widgets),
      ([id]) => id,
      ([_, widget]) => widget
    )}`;

    const children = this.renderChildren(this.model, child => {
      const isNote = matchFlavours(child, ['affine:note']);
      const note = child as NoteBlockModel;
      const displayOnEdgeless =
        !!note.displayMode && note.displayMode === NoteDisplayMode.EdgelessOnly;
      // Should remove deprecated `hidden` property in the future
      return !(isNote && displayOnEdgeless);
    });

    return html`
      <div class="affine-page-root-block-container">
        <div class="affine-page-root-left-blank"></div>
        <div class="affine-page-root-content" contenteditable="true">
          ${children} ${widgets}
        </div>
        <div class="affine-page-root-right-blank"></div>
        <div class="affine-page-root-bottom-blank"></div>
      </div>
    `;
  }

  @query('.affine-page-root-left-blank')
  accessor leftBlankArea!: HTMLDivElement;

  @query('.affine-page-root-right-blank')
  accessor rightBlankArea!: HTMLDivElement;

  @query('.affine-page-root-block-container')
  accessor rootElementContainer!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-page-root': PageRootBlockComponent;
  }
}
