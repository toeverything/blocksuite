import '../buttons/tool-icon-button.js';
import './change-shape-button.js';
import './change-brush-button.js';
import './change-connector-button.js';
import './change-note-button.js';
import './change-text-button.js';
import './change-frame-button.js';
import './add-frame-button.js';
import './more-button.js';
import './align-button.js';

import { atLeastNMatches, groupBy, pickValues } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import { stopPropagation } from '../../../../_common/utils/event.js';
import type { FrameBlockModel } from '../../../../frame-block/index.js';
import type { ImageBlockModel, NoteBlockModel } from '../../../../index.js';
import type {
  BrushElement,
  ConnectorElement,
  ShapeElement,
  TextElement,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isFrameBlock, isImageBlock, isNoteBlock } from '../../utils/query.js';

type CategorizedElements = {
  shape: ShapeElement[];
  brush: BrushElement[];
  text: TextElement[];
  connector: ConnectorElement[];
  note: NoteBlockModel[];
  frame: FrameBlockModel[];
  image: ImageBlockModel[];
};

@customElement('edgeless-component-toolbar')
export class EdgelessComponentToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      position: absolute;
      user-select: none;
    }

    :host([data-show]) {
      display: block;
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
    }

    component-toolbar-menu-divider {
      margin: 0 12px;
    }
  `;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get page() {
    return this.edgeless.page;
  }

  get selection() {
    return this.edgeless.selectionManager;
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
      }
      return model.type;
    });
    return result as CategorizedElements;
  }

  private _getShapeButton(shapeElements?: ShapeElement[]) {
    const shapeButton = shapeElements?.length
      ? html`<edgeless-change-shape-button
          .elements=${shapeElements}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
        >
        </edgeless-change-shape-button>`
      : nothing;
    return shapeButton;
  }

  private _getBrushButton(brushElements?: BrushElement[]) {
    return brushElements?.length
      ? html`<edgeless-change-brush-button
          .elements=${brushElements}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
        >
        </edgeless-change-brush-button>`
      : nothing;
  }

  private _getConnectorButton(connectorElements?: ConnectorElement[]) {
    return connectorElements?.length
      ? html` <edgeless-change-connector-button
          .elements=${connectorElements}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
          .edgeless=${this.edgeless}
        >
        </edgeless-change-connector-button>`
      : nothing;
  }

  private _getNoteButton(nots?: NoteBlockModel[]) {
    return nots?.length === 1
      ? html`<edgeless-change-note-button
          .notes=${nots}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
        >
        </edgeless-change-note-button>`
      : nothing;
  }

  private _getTextButton(textElements: TextElement[]) {
    return textElements?.length
      ? html`<edgeless-change-text-button
          .texts=${textElements}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
        >
        </edgeless-change-text-button>`
      : nothing;
  }

  private _getFrameButton(frames: FrameBlockModel[]) {
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

  private _updateOnSelectedChange = (element: string | { id: string }) => {
    const id = typeof element === 'string' ? element : element.id;

    if (this.selection.isSelected(id)) {
      this.requestUpdate();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.selection.slots.updated.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.add(
      this.edgeless.page.slots.blockUpdated.on(this._updateOnSelectedChange)
    );
    pickValues(this.edgeless.surface.slots, [
      'elementAdded',
      'elementRemoved',
      'elementUpdated',
    ]).forEach(slot =>
      this._disposables.add(slot.on(this._updateOnSelectedChange))
    );
  }

  private _getCreateFrameButton() {
    return html`<edgeless-add-frame-button
      .edgeless=${this.edgeless}
    ></edgeless-add-frame-button>`;
  }

  private _getAlignButton() {
    return html`<edgeless-align-button
      .edgeless=${this.edgeless}
    ></edgeless-align-button>`;
  }

  override render() {
    const groupedSelected = this._groupSelected();
    const { edgeless } = this;
    const { shape, brush, connector, note, text, frame } = groupedSelected;

    const selectedAtLeastTwoTypes = atLeastNMatches(
      Object.values(groupedSelected),
      e => !!e.length,
      2
    );

    const buttons = selectedAtLeastTwoTypes
      ? []
      : [
          this._getShapeButton(shape),
          this._getBrushButton(brush),
          this._getConnectorButton(connector),
          this._getNoteButton(note),
          this._getTextButton(text),
          this._getFrameButton(frame),
        ].filter(b => !!b && b !== nothing);

    if (this.selection.state.elements.length > 1) {
      buttons.unshift(
        html`<component-toolbar-menu-divider></component-toolbar-menu-divider>`
      );
      buttons.unshift(this._getAlignButton());
      buttons.unshift(
        html`<component-toolbar-menu-divider></component-toolbar-menu-divider>`
      );
      buttons.unshift(this._getCreateFrameButton());
    }
    const last = buttons.at(-1);
    if (
      buttons.length > 0 &&
      (typeof last === 'symbol' ||
        !last?.strings[0].includes('component-toolbar-menu-divider'))
    ) {
      buttons.push(
        html`<component-toolbar-menu-divider></component-toolbar-menu-divider>`
      );
    }

    return html`<div
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
