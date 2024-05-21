import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import './more-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, nothing, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import { stopPropagation } from '../../../_common/utils/event.js';
import {
  atLeastNMatches,
  groupBy,
  pickValues,
} from '../../../_common/utils/iterable.js';
import type { AttachmentBlockModel } from '../../../attachment-block/attachment-model.js';
import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../../../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedLoomModel } from '../../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../../../frame-block/frame-model.js';
import type { ImageBlockModel } from '../../../image-block/image-model.js';
import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { MindmapElementModel } from '../../../surface-block/element-model/mindmap.js';
import {
  type ElementModel,
  GroupElementModel,
} from '../../../surface-block/index.js';
import {
  type BrushElementModel,
  clamp,
  type ConnectorElementModel,
  type ShapeElementModel,
  type TextElementModel,
} from '../../../surface-block/index.js';
import { renderMenuDivider } from '../../edgeless/components/buttons/menu-button.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { EdgelessModel } from '../../edgeless/type.js';
import { edgelessElementsBound } from '../../edgeless/utils/bound-utils.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbeddedBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../edgeless/utils/query.js';
import type { RootBlockModel } from '../../root-model.js';
import { renderAddFrameButton } from './add-frame-button.js';
import { renderAddGroupButton } from './add-group-button.js';
import { renderAlignButton } from './align-button.js';
import { renderAttachmentButton } from './change-attachment-button.js';
import { renderChangeBrushButton } from './change-brush-button.js';
import { renderConnectorButton } from './change-connector-button.js';
import { renderEmbedButton } from './change-embed-card-button.js';
import { renderFrameButton } from './change-frame-button.js';
import { renderGroupButton } from './change-group-button.js';
import { renderChangeImageButton } from './change-image-button.js';
import { renderMindmapButton } from './change-mindmap-button.js';
import { renderNoteButton } from './change-note-button.js';
import { renderChangeShapeButton } from './change-shape-button.js';
import { renderChangeTextButton } from './change-text-button.js';
import { renderReleaseFromGroupButton } from './release-from-group-button.js';

type CategorizedElements = {
  shape?: ShapeElementModel[];
  brush?: BrushElementModel[];
  text?: TextElementModel[];
  group?: GroupElementModel[];
  connector?: ConnectorElementModel[];
  note?: NoteBlockModel[];
  frame?: FrameBlockModel[];
  image?: ImageBlockModel[];
  attachment?: AttachmentBlockModel[];
  mindmap?: MindmapElementModel[];
  embedCard?: BookmarkBlockModel[] &
    EmbedGithubModel[] &
    EmbedYoutubeModel[] &
    EmbedFigmaModel[] &
    EmbedLinkedDocModel[] &
    EmbedSyncedDocModel[] &
    EmbedHtmlModel[] &
    EmbedLoomModel[];
};

type CustomEntry = {
  render: (edgeless: EdgelessRootBlockComponent) => TemplateResult | null;
  when: (model: EdgelessModel[]) => boolean;
};

export const EDGELESS_ELEMENT_TOOLBAR_WIDGET =
  'edgeless-element-toolbar-widget';

@customElement(EDGELESS_ELEMENT_TOOLBAR_WIDGET)
export class EdgelessElementToolbarWidget extends WidgetElement<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 3;
      transform: translateZ(0);
      will-change: transform;
    }

    .edgeless-component-toolbar-container {
      display: flex;
      height: 36px;
      width: max-content;
      padding: 0 6px;
      align-items: center;
      gap: 8px;
      background: var(--affine-background-overlay-panel-color);
      border: 0.5px solid var(--affine-border-color);
      // box-shadow: var(--affine-menu-shadow);
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);
      border-radius: 4px;
      // box-sizing: border-box;
      box-sizing: content-box;
      user-select: none;

      text-align: justify;
      font-feature-settings:
        'clig' off,
        'liga' off;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 400;
      line-height: 22px; /* 157.143% */
    }

    .edgeless-component-toolbar-container > * {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      color: var(--affine-text-primary-color);
      fill: currentColor;
    }

    .color-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 20px;
      height: 20px;
    }
  `;

  @property({ attribute: false })
  enableNoteSlicer!: boolean;

  @state()
  toolbarVisible = false;

  @state()
  private _dragging = false;

  @state()
  private _registeredEntries: {
    render: (edgeless: EdgelessRootBlockComponent) => TemplateResult | null;
    when: (model: EdgelessModel[]) => boolean;
  }[] = [];

  @state({
    hasChanged: (value: string[], oldValue: string[]) => {
      if (value.length !== oldValue?.length) {
        return true;
      }

      return value.some((id, index) => id !== oldValue[index]);
    },
  })
  selectedIds: string[] = [];

  get edgeless() {
    return this.blockElement as EdgelessRootBlockComponent;
  }

  get selection() {
    return this.edgeless.service.selection;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  private _groupSelected(): CategorizedElements {
    const result = groupBy(this.selection.elements, model => {
      if (isNoteBlock(model)) {
        return 'note';
      } else if (isFrameBlock(model)) {
        return 'frame';
      } else if (isImageBlock(model)) {
        return 'image';
      } else if (isAttachmentBlock(model)) {
        return 'attachment';
      } else if (isBookmarkBlock(model) || isEmbeddedBlock(model)) {
        return 'embedCard';
      }

      return (model as ElementModel).type;
    });
    return result as CategorizedElements;
  }

  private _updateOnSelectedChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;

    if (this.isConnected && this.selection.has(id)) {
      this._recalculatePosition();
      this.requestUpdate();
    }
  };

  protected override firstUpdated() {
    const { _disposables, edgeless } = this;

    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        this._recalculatePosition();
      })
    );

    _disposables.add(
      this.selection.slots.updated.on(() => {
        if (
          this.selection.selectedIds.length === 0 ||
          this.selection.editing ||
          this.selection.inoperable
        ) {
          this.toolbarVisible = false;
        } else {
          this.toolbarVisible = true;
          this._recalculatePosition();
        }
      })
    );

    pickValues(this.edgeless.service.surface, [
      'elementAdded',
      'elementUpdated',
    ]).forEach(slot => _disposables.add(slot.on(this._updateOnSelectedChange)));

    _disposables.add(
      this.doc.slots.blockUpdated.on(this._updateOnSelectedChange)
    );

    _disposables.add(
      edgeless.dispatcher.add('dragStart', () => {
        this._dragging = true;
      })
    );
    _disposables.add(
      edgeless.dispatcher.add('dragEnd', () => {
        this._dragging = false;
        this._recalculatePosition();
      })
    );

    _disposables.add(
      edgeless.slots.elementResizeStart.on(() => {
        this._dragging = true;
      })
    );
    _disposables.add(
      edgeless.slots.elementResizeEnd.on(() => {
        this._dragging = false;
        this._recalculatePosition();
      })
    );
  }

  private _recalculatePosition() {
    const { selection, viewport } = this.edgeless.service;
    const elements = selection.elements;

    if (elements.length === 0) {
      this.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const bound = edgelessElementsBound(selection.elements);

    const { width, height } = viewport;
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);
    const [right, bottom] = viewport.toViewCoord(bound.maxX, bound.maxY);

    let left, top;
    if (x >= width || right <= 0 || y >= height || bottom <= 0) {
      left = x;
      top = y;

      this.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      return;
    }

    let offset = 70;
    if (this.selection.elements.some(ele => isFrameBlock(ele))) {
      offset += 10;
    }

    top = y - offset;
    top < 0 && (top = y + bound.h * viewport.zoom + offset);

    left = clamp(x, 10, width - 10);
    top = clamp(top, 10, height - 150);

    this.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    this.selectedIds = this.selection.selectedIds;
  }

  registerEntry(entry: CustomEntry) {
    this._registeredEntries.push(entry);
  }

  override render() {
    if (this.doc.readonly || this._dragging || !this.toolbarVisible) {
      return nothing;
    }

    const groupedSelected = this._groupSelected();
    const { edgeless, selection } = this;
    const {
      shape,
      brush,
      connector,
      note,
      text,
      frame,
      group,
      embedCard,
      attachment,
      image,
    } = groupedSelected;
    const { elements } = this.selection;
    const selectedAtLeastTwoTypes = atLeastNMatches(
      Object.values(groupedSelected),
      e => !!e.length,
      2
    );

    const generalButtons =
      elements.length !== connector?.length
        ? [
            renderAddFrameButton(edgeless, elements),
            renderAddGroupButton(edgeless, elements),
            renderAlignButton(edgeless, elements),
          ]
        : [];

    const buttons = selectedAtLeastTwoTypes
      ? generalButtons
      : [
          ...generalButtons,
          renderMindmapButton(edgeless, shape),
          renderChangeShapeButton(edgeless, shape),
          renderChangeBrushButton(edgeless, brush),
          renderConnectorButton(edgeless, connector),
          renderNoteButton(edgeless, note),
          renderChangeTextButton(edgeless, text),
          renderFrameButton(edgeless, frame),
          renderGroupButton(edgeless, group),
          renderEmbedButton(edgeless, embedCard),
          renderAttachmentButton(edgeless, attachment),
          renderChangeImageButton(edgeless, image),
        ];

    if (elements.length === 1) {
      if (selection.firstElement.group instanceof GroupElementModel) {
        buttons.unshift(renderReleaseFromGroupButton(this.edgeless));
      }
    }

    const registeredEntries = this._registeredEntries
      .filter(entry => entry.when(elements))
      .map(entry => entry.render(this.edgeless));

    if (registeredEntries.length) {
      registeredEntries.forEach(entry => entry && buttons.unshift(entry));
    }

    const realButtons = buttons.filter(b => b !== nothing);

    return html`<div
      class="edgeless-component-toolbar-container"
      @pointerdown=${stopPropagation}
    >
      ${join(realButtons, renderMenuDivider)}
      ${realButtons.length ? renderMenuDivider() : nothing}
      <edgeless-more-button
        .edgeless=${edgeless}
        .vertical=${true}
      ></edgeless-more-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-element-toolbar-widget': EdgelessElementToolbarWidget;
  }
}
