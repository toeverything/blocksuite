import '../buttons/tool-icon-button.js';
import './change-shape-button.js';
import './change-brush-button.js';
import './change-connector-button.js';
import './change-note-button.js';
import './change-text-button.js';
import './change-frame-button.js';
import './change-group-button.js';
import './change-embed-card-button.js';
import './change-attachment-button.js';
import './change-image-button.js';
import './add-frame-button.js';
import './add-group-button.js';
import './release-from-group-button.js';
import './more-button.js';
import './align-button.js';

import { WithDisposable } from '@blocksuite/block-std';
import { baseTheme } from '@toeverything/theme';
import {
  css,
  html,
  LitElement,
  nothing,
  type PropertyValues,
  type TemplateResult,
  unsafeCSS,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import { stopPropagation } from '../../../../_common/utils/event.js';
import {
  atLeastNMatches,
  groupBy,
  pickValues,
} from '../../../../_common/utils/iterable.js';
import type { AttachmentBlockModel } from '../../../../attachment-block/attachment-model.js';
import type { BookmarkBlockModel } from '../../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../../embed-github-block/embed-github-model.js';
import type { EmbedHtmlModel } from '../../../../embed-html-block/embed-html-model.js';
import type { EmbedLinkedDocModel } from '../../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedLoomModel } from '../../../../embed-loom-block/embed-loom-model.js';
import type { EmbedSyncedDocModel } from '../../../../embed-synced-doc-block/embed-synced-doc-model.js';
import type { EmbedYoutubeModel } from '../../../../embed-youtube-block/embed-youtube-model.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import type { ImageBlockModel } from '../../../../image-block/image-model.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import type {
  ElementModel,
  GroupElementModel,
} from '../../../../surface-block/index.js';
import {
  type BrushElementModel,
  clamp,
  type ConnectorElementModel,
  type ShapeElementModel,
  type TextElementModel,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { edgelessElementsBound } from '../../utils/bound-utils.js';
import {
  isAttachmentBlock,
  isBookmarkBlock,
  isEmbeddedBlock,
  isFrameBlock,
  isImageBlock,
  isNoteBlock,
} from '../../utils/query.js';

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
  embedCard?: BookmarkBlockModel[] &
    EmbedGithubModel[] &
    EmbedYoutubeModel[] &
    EmbedFigmaModel[] &
    EmbedLinkedDocModel[] &
    EmbedSyncedDocModel[] &
    EmbedHtmlModel[] &
    EmbedLoomModel[];
};

type ToolBarCustomAction = {
  disable?: (formatBar: EdgelessComponentToolbar) => boolean;
  icon(formatBar: EdgelessComponentToolbar): string | undefined;
  onClick(formatBar: EdgelessComponentToolbar): void;
};
type ToolBarCustomElement = {
  showWhen?(formatBar: EdgelessComponentToolbar): boolean;
  init(formatBar: EdgelessComponentToolbar): HTMLElement;
};
type ToolBarCustomRenderer = {
  render(formatBar: EdgelessComponentToolbar): TemplateResult | undefined;
};
@customElement('edgeless-component-toolbar')
export class EdgelessComponentToolbar extends WithDisposable(LitElement) {
  static override styles = css`
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
  private static readonly _customElements: Set<ToolBarCustomRenderer> =
    new Set<ToolBarCustomRenderer>();

  static registerCustomRenderer(render: ToolBarCustomRenderer) {
    this._customElements.add(render);
  }
  static registerCustomElement(element: ToolBarCustomElement) {
    let elementInstance: HTMLElement | undefined;
    this._customElements.add({
      ...element,
      render: formatBar => {
        if (!elementInstance) {
          elementInstance = element.init(formatBar);
        }
        const show = element.showWhen?.(formatBar) ?? true;
        return show ? html`${elementInstance}` : undefined;
      },
    });
  }

  static registerCustomAction(action: ToolBarCustomAction) {
    this._customElements.add({
      render: formatBar => {
        const url = action.icon(formatBar);
        if (url == null) {
          return;
        }
        const disable = action.disable ? action.disable(formatBar) : false;
        const click = () => {
          if (!disable) {
            action.onClick(formatBar);
          }
        };
        return html`<icon-button
          size="32px"
          ?disabled=${disable}
          @click=${click}
        >
          <img src="${url}" alt="" />
        </icon-button>`;
      },
    });
  }

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  enableNoteSlicer!: boolean;

  @state()
  left = 0;

  @state()
  top = 0;

  get doc() {
    return this.edgeless.doc;
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

  private _ShapeButton(shapeElements?: ShapeElementModel[]) {
    const shapeButton = shapeElements?.length
      ? html`<edgeless-change-shape-button
          .elements=${shapeElements}
          .doc=${this.doc}
          .surface=${this.surface}
        >
        </edgeless-change-shape-button>`
      : nothing;
    return shapeButton;
  }

  private _BrushButton(brushElements?: BrushElementModel[]) {
    return brushElements?.length
      ? html`<edgeless-change-brush-button
          .elements=${brushElements}
          .doc=${this.doc}
          .surface=${this.surface}
        >
        </edgeless-change-brush-button>`
      : nothing;
  }

  private _ConnectorButton(connectorElements?: ConnectorElementModel[]) {
    return connectorElements?.length
      ? html` <edgeless-change-connector-button
          .elements=${connectorElements}
          .doc=${this.doc}
          .surface=${this.surface}
          .edgeless=${this.edgeless}
        >
        </edgeless-change-connector-button>`
      : nothing;
  }

  private _NoteButton(notes?: NoteBlockModel[]) {
    return notes && notes.length >= 0
      ? html`<edgeless-change-note-button
          .notes=${notes}
          .surface=${this.surface}
          .enableNoteSlicer=${this.enableNoteSlicer}
        >
        </edgeless-change-note-button>`
      : nothing;
  }

  private _TextButton(textElements?: TextElementModel[]) {
    return textElements?.length
      ? html`<edgeless-change-text-button
          .texts=${textElements}
          .doc=${this.doc}
          .surface=${this.surface}
        >
        </edgeless-change-text-button>`
      : nothing;
  }

  private _FrameButton(frames?: FrameBlockModel[]) {
    return frames?.length
      ? html`
          <edgeless-change-frame-button
            .surface=${this.surface}
            .frames=${frames}
          >
          </edgeless-change-frame-button>
        `
      : nothing;
  }

  private _GroupButton(groups?: GroupElementModel[]) {
    return groups?.length
      ? html`<edgeless-change-group-button
          .surface=${this.surface}
          .groups=${groups}
        >
        </edgeless-change-group-button>`
      : nothing;
  }

  private _EmbedCardButton(embedCards?: CategorizedElements['embedCard']) {
    if (embedCards?.length !== 1) return nothing;

    return html`
      <edgeless-change-embed-card-button
        .model=${embedCards[0]}
        .std=${this.edgeless.std}
        .surface=${this.surface}
      ></edgeless-change-embed-card-button>
    `;
  }

  private _AttachmentButton(attachments?: CategorizedElements['attachment']) {
    if (attachments?.length !== 1) return nothing;

    return html`
      <edgeless-change-attachment-button
        .model=${attachments[0]}
        .std=${this.edgeless.std}
        .surface=${this.surface}
      ></edgeless-change-attachment-button>
    `;
  }

  private _ImageButton(images?: CategorizedElements['image']) {
    if (images?.length !== 1) return nothing;

    return html`
      <edgeless-change-image-button
        .model=${images[0]}
        .std=${this.edgeless.std}
        .surface=${this.surface}
      ></edgeless-change-image-button>
    `;
  }

  private _updateOnSelectedChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;

    if (this.isConnected && this.selection.has(id)) {
      this.requestUpdate();
    }
  };

  protected override firstUpdated() {
    const { _disposables, edgeless } = this;
    _disposables.add(
      edgeless.service.viewport.viewportUpdated.on(() => {
        const [left, top] = this._computePosition();
        this.left = left;
        this.top = top;
      })
    );

    _disposables.add(
      this.selection.slots.updated.on(() => {
        this.requestUpdate();
      })
    );

    pickValues(this.edgeless.service.surface, [
      'elementAdded',
      'elementRemoved',
      'elementUpdated',
    ]).forEach(slot => _disposables.add(slot.on(this._updateOnSelectedChange)));

    _disposables.add(
      this.doc.slots.blockUpdated.on(this._updateOnSelectedChange)
    );
  }

  private _CreateGroupButton() {
    return html`<edgeless-add-group-button
      .edgeless=${this.edgeless}
    ></edgeless-add-group-button> `;
  }

  private _CreateFrameButton() {
    return html`<edgeless-add-frame-button
      .edgeless=${this.edgeless}
    ></edgeless-add-frame-button>`;
  }

  private _ReleaseFromGroupButton() {
    return html`<edgeless-release-from-group-button
      .surface=${this.surface}
    ></edgeless-release-from-group-button>`;
  }

  private _AlignButton() {
    return html`<edgeless-align-button
      .edgeless=${this.edgeless}
    ></edgeless-align-button>`;
  }

  private _Divider() {
    return html`<component-toolbar-menu-divider></component-toolbar-menu-divider>`;
  }

  protected override async updated(_changedProperties: PropertyValues) {
    await this.updateComplete;
    const [left, top] = this._computePosition();
    this.left = left;
    this.top = top;
  }

  private _computePosition() {
    const { selection, viewport } = this.edgeless.service;

    const bound = edgelessElementsBound(selection.elements);

    const { width, height } = viewport;
    const [x, y] = viewport.toViewCoord(bound.x, bound.y);

    const [right, bottom] = viewport.toViewCoord(bound.maxX, bound.maxY);
    const rect = this.getBoundingClientRect();
    let left, top;
    if (x >= width || right <= 0 || y >= height || bottom <= 0) {
      left = right <= 0 ? x - rect.width : x;
      top = bottom <= 0 ? y - rect.height : y;
      return [left, top];
    }

    let offset = 34;
    if (this.selection.elements.some(ele => isFrameBlock(ele))) {
      offset += 10;
    }
    top = y - rect.height - offset;
    top < 0 && (top = y + bound.h * viewport.zoom + offset);

    left = clamp(x, 10, width - rect.width - 10);
    top = clamp(top, 10, height - rect.height - 100);
    return [left, top];
  }

  private _customRender() {
    const result: TemplateResult[] = [];
    EdgelessComponentToolbar._customElements.forEach(render => {
      const element = render.render(this);
      if (element) {
        result.push(element);
      }
    });
    return result.length > 0
      ? html` <div
          style="display: flex;align-items: center;justify-content: center"
        >
          ${result}
        </div>`
      : null;
  }

  override render() {
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
          this._ShapeButton(shape),
          this._BrushButton(brush),
          this._ConnectorButton(connector),
          this._NoteButton(note),
          this._TextButton(text),
          this._FrameButton(frame),
          this._GroupButton(group),
          this._EmbedCardButton(embedCard),
          this._AttachmentButton(attachment),
          this._ImageButton(image),
        ].filter(b => !!b && b !== nothing);

    if (elements.length > 1) {
      buttons.unshift(this._Divider());
      buttons.unshift(this._AlignButton());
      buttons.unshift(this._Divider());
      buttons.unshift(this._CreateGroupButton());
      buttons.unshift(this._Divider());
      buttons.unshift(this._CreateFrameButton());
    }

    if (elements.length === 1) {
      if (selection.firstElement.group !== null) {
        buttons.unshift(this._Divider());
        buttons.unshift(this._ReleaseFromGroupButton());
      }
    }

    const last = buttons.at(-1);
    if (
      buttons.length > 0 &&
      (typeof last === 'symbol' ||
        !last?.strings[0].includes('component-toolbar-menu-divider'))
    ) {
      buttons.push(this._Divider());
    }
    const customRenderResult = this._customRender();
    if (customRenderResult) {
      buttons.unshift(this._Divider());
      buttons.unshift(customRenderResult);
    }
    return html` <style>
        :host {
          position: absolute;
          z-index: 3;
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
    'edgeless-component-toolbar': EdgelessComponentToolbar;
  }
}
