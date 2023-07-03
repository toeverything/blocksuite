import '../buttons/tool-icon-button.js';
import './change-shape-button.js';
import './change-brush-button.js';
import './change-connector-button.js';
import './change-note-button.js';
import './change-text-button.js';
import './more-button.js';

import type {
  BrushElement,
  ConnectorElement,
  ShapeElement,
  TextElement,
} from '@blocksuite/phasor';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import {
  atLeastNMatches,
  groupBy,
} from '../../../../__internal__/utils/common.js';
import { stopPropagation } from '../../../../__internal__/utils/event.js';
import type { TopLevelBlockModel } from '../../../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { isTopLevelBlock } from '../../utils/query.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';

type CategorizedElements = {
  shape: ShapeElement[];
  brush: BrushElement[];
  note: TopLevelBlockModel[];
  connector: ConnectorElement[];
  text: TextElement[];
};

@customElement('edgeless-component-toolbar')
export class EdgelessComponentToolbar extends LitElement {
  static override styles = css`
    :host {
      display: none;
      position: absolute;
      user-select: none;
    }

    :host([data-show]) {
      display: block;
    }

    .container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-menu-shadow);
      border-radius: 8px;
    }

    menu-divider {
      height: 24px;
    }
  `;

  @property({ type: Object })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get page() {
    return this.edgeless.page;
  }

  get selected() {
    return this.selectionState.selected;
  }

  get slots() {
    return this.edgeless.slots;
  }

  get surface() {
    return this.edgeless.surface;
  }

  private _groupSelected(): CategorizedElements {
    const result = groupBy(this.selected, s => {
      if (isTopLevelBlock(s)) {
        return 'note';
      }
      return s.type;
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
          .selectionState=${this.selectionState}
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
          .selectionState=${this.selectionState}
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
          .selectionState=${this.selectionState}
        >
        </edgeless-change-connector-button>`
      : nothing;
  }

  private _getNoteButton(blocks?: TopLevelBlockModel[]) {
    return blocks?.length
      ? html`<edgeless-change-note-button
          .notes=${blocks}
          .page=${this.page}
          .surface=${this.surface}
          .slots=${this.slots}
          .selectionState=${this.selectionState}
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
          .selectionState=${this.selectionState}
        >
        </edgeless-change-text-button>`
      : nothing;
  }

  override render() {
    const groupedSelected = this._groupSelected();
    const { edgeless, selected } = this;
    const { shape, brush, connector, note, text } = groupedSelected;

    // when selected types more than two, only show `more` button
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
        ].filter(b => !!b);

    const divider = buttons.length
      ? html`<menu-divider .vertical=${true}></menu-divider>`
      : nothing;

    return html`<div class="container" @pointerdown=${stopPropagation}>
      ${join(buttons, () => '')} ${divider}
      <edgeless-more-button .elements=${selected} .edgeless=${edgeless}>
      </edgeless-more-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-component-toolbar': EdgelessComponentToolbar;
  }
}
