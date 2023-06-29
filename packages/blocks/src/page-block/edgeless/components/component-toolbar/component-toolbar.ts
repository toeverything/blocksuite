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
  SurfaceManager,
  TextElement,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import {
  atLeastNMatches,
  groupBy,
} from '../../../../__internal__/utils/common.js';
import { stopPropagation } from '../../../../__internal__/utils/event.js';
import type { TopLevelBlockModel } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import { isTopLevelBlock } from '../../utils/query.js';
import type { EdgelessSelectionState } from '../../utils/selection-manager.js';
import type { Selectable } from '../../utils/selection-manager.js';

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
      display: block;
      position: absolute;
      user-select: none;
    }

    .container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      border-radius: 8px;
    }

    menu-divider {
      height: 24px;
    }
  `;

  @property({ attribute: false })
  selected: Selectable[] = [];

  @property({ type: Object })
  selectionState!: EdgelessSelectionState;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  surface!: SurfaceManager;

  @property({ attribute: false })
  slots!: EdgelessSelectionSlots;

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
      : null;
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
      : null;
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
      : null;
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
      : null;
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
      : null;
  }

  override render() {
    const groupedSelected = this._groupSelected();
    const { shape, brush, connector, note: note, text } = groupedSelected;

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

    const divider = !buttons.length
      ? nothing
      : html`<menu-divider .vertical=${true}></menu-divider>`;
    return html`<div class="container" @pointerdown=${stopPropagation}>
      ${join(buttons, () => '')} ${divider}
      <edgeless-more-button
        .elements=${this.selected}
        .page=${this.page}
        .surface=${this.surface}
        .slots=${this.slots}
      >
      </edgeless-more-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-component-toolbar': EdgelessComponentToolbar;
  }
}
