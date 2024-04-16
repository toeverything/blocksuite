import '../../edgeless/components/buttons/tool-icon-button.js';
import './more-button.js';

import { WidgetElement } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import { css, html, nothing, unsafeCSS } from 'lit';
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
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
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
import { renderMenuDivider } from './component-toolbar-menu-divider.js';
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

export const EDGELESS_ELEMENT_TOOLBAR_WIDGET =
  'edgeless-element-toolbar-widget';

@customElement(EDGELESS_ELEMENT_TOOLBAR_WIDGET)
export class EdgelessComponentToolbar extends WidgetElement<
  RootBlockModel,
  EdgelessRootBlockComponent
> {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 3;
    }

    .edgeless-component-toolbar-container {
      display: flex;
      align-items: center;
      height: 40px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      border-radius: 8px;
      padding: 0 8px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      user-select: none;
    }

    component-toolbar-menu-divider {
      width: 4px;
      margin: 0 12px;
      height: 24px;
    }
  `;

  @property({ attribute: false })
  enableNoteSlicer!: boolean;

  @state()
  left = 0;

  @state()
  top = 0;

  @state()
  toolbarVisible = false;

  @state()
  private _dragging = false;

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
        this._recalculatePosition();
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
      edgeless.service.selection.slots.updated.on(() => {
        const selection = edgeless.service.selection;

        if (selection.selectedIds.length === 0 || selection.editing) {
          this.toolbarVisible = false;
        } else {
          this.toolbarVisible = true;
        }
      })
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
  }

  private _recalculatePosition() {
    const { selection, viewport } = this.edgeless.service;
    const elements = selection.elements;

    if (elements.length === 0) {
      this.left = 0;
      this.top = 0;
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

      this.left = left;
      this.top = top;
      return;
    }

    let offset = 50;
    if (this.selection.elements.some(ele => isFrameBlock(ele))) {
      offset += 10;
    }

    top = y - offset;
    top < 0 && (top = y + bound.h * viewport.zoom + offset);

    left = clamp(x, 10, width - 10);
    top = clamp(top, 10, height - 100);

    this.left = left;
    this.top = top;
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

    const buttons = selectedAtLeastTwoTypes
      ? []
      : [
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
        ].filter(b => !!b && b !== nothing);

    if (elements.length > 1 && elements.length !== connector?.length) {
      buttons.unshift(renderMenuDivider());
      buttons.unshift(renderAlignButton(this.edgeless));
      buttons.unshift(renderMenuDivider());
      buttons.unshift(renderAddGroupButton(this.edgeless));
      buttons.unshift(renderMenuDivider());
      buttons.unshift(renderAddFrameButton(this.edgeless));
    }

    if (elements.length === 1) {
      if (selection.firstElement.group instanceof GroupElementModel) {
        buttons.unshift(renderMenuDivider());
        buttons.unshift(renderReleaseFromGroupButton(this.edgeless));
      }
    }

    const last = buttons.at(-1);
    if (
      buttons.length > 0 &&
      (typeof last === 'symbol' ||
        !last?.strings[0].includes('component-toolbar-menu-divider'))
    ) {
      buttons.push(renderMenuDivider());
    }

    return html` <style>
        :host {
          left: ${this.left}px;
          top: ${this.top}px;
        }
      </style>
      <div
        class="edgeless-component-toolbar-container"
        @pointerdown=${stopPropagation}
      >
        ${join(buttons, () => '')}
        <edgeless-more-button
          .edgeless=${edgeless}
          .vertical=${true}
        ></edgeless-more-button>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-element-toolbar-widget': EdgelessComponentToolbar;
  }
}
