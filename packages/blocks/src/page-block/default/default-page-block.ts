/// <reference types="vite/client" />
import './meta-data/meta-data.js';

import {
  PAGE_BLOCK_CHILD_PADDING,
  PAGE_BLOCK_PADDING_BOTTOM,
} from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { matchFlavours, Slot } from '@blocksuite/store';
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
import { asyncFocusRichText } from '../../__internal__/index.js';
import { getService, registerService } from '../../__internal__/service.js';
import { activeEditorManager } from '../../__internal__/utils/active-editor-manager.js';
import type { DocPageBlockWidgetName } from '../index.js';
import { PageBlockService } from '../index.js';
import type { PageBlockModel } from '../page-model.js';
import type { DefaultPageService } from './default-page-service.js';
import {
  Gesture,
  Keyboard,
  RangeController,
  Synchronizer,
} from './event/index.js';

export interface PageViewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  clientWidth: number;
}

@customElement('affine-default-page')
export class DefaultPageBlockComponent
  extends BlockElement<
    PageBlockModel,
    DefaultPageService,
    DocPageBlockWidgetName
  >
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
      /* Do not use prettier format this style, or it will be broken */
      /* prettier-ignore */
      padding-left: var(--affine-editor-side-padding, ${PAGE_BLOCK_CHILD_PADDING}px);
      /* prettier-ignore */
      padding-right: var(--affine-editor-side-padding, ${PAGE_BLOCK_CHILD_PADDING}px);
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
      padding: 38px 0;
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

    @media print {
      .selected {
        background-color: transparent !important;
      }
    }
  `;

  rangeController!: RangeController;

  flavour = 'affine:page' as const;

  clipboard = new PageClipboard(this);

  getService = getService;

  lastSelectionPosition: SelectionPosition = 'start';

  gesture: Gesture | null = null;

  synchronizer: Synchronizer | null = null;

  keyboard: Keyboard | null = null;

  @state()
  private _isComposing = false;

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
    tagClicked: new Slot<{
      tagId: string;
    }>(),
  };

  @query('.affine-default-page-block-title')
  private _titleContainer!: HTMLElement;
  private _titleVEditor: VEditor | null = null;

  get disposables() {
    return this._disposables;
  }

  get titleVEditor() {
    assertExists(this._titleVEditor);
    return this._titleVEditor;
  }

  get viewport(): PageViewport {
    if (!this.viewportElement) {
      return {
        left: 0,
        top: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        clientWidth: 0,
      };
    }

    const { clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop } =
      this.viewportElement;
    const { top, left } = this.viewportElement.getBoundingClientRect();
    return {
      top,
      left,
      clientHeight,
      clientWidth,
      scrollHeight,
      scrollLeft,
      scrollTop,
    };
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

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('model')) {
      if (this.model && !this._titleVEditor) {
        this._initTitleVEditor();
      }
    }
  }

  private _initSlotEffects() {
    this._disposables.add(
      this.model.childrenUpdated.on(() => this.requestUpdate())
    );
  }

  override firstUpdated() {
    this._initSlotEffects();
  }

  override connectedCallback() {
    super.connectedCallback();

    registerService('affine:page', PageBlockService);
    this.rangeController = new RangeController(this.root);
    this.clipboard.init(this.page);
    this.gesture = new Gesture(this);
    this.synchronizer = new Synchronizer(this);
    this.keyboard = new Keyboard(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.clipboard.dispose();
    this._disposables.dispose();
    this.gesture = null;
    this.synchronizer = null;
    this.keyboard = null;
  }

  override render() {
    const isEmpty =
      (!this.model.title || !this.model.title.length) && !this._isComposing;
    const title = html`
      <div
        data-block-is-title="true"
        class="affine-default-page-block-title ${isEmpty
          ? 'affine-default-page-block-title-empty'
          : ''}"
      ></div>
    `;

    const content = html`${repeat(
      this.model?.children.filter(
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

    const meta = html`
      <affine-page-meta-data
        .host="${this}"
        .page="${this.page}"
      ></affine-page-meta-data>
    `;

    return html`
      <div class="affine-default-viewport">
        <div class="affine-default-page-block-container">
          <div class="affine-default-page-block-title-container">
            ${title} ${meta}
          </div>
          ${content} ${widgets}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-default-page': DefaultPageBlockComponent;
  }
}
