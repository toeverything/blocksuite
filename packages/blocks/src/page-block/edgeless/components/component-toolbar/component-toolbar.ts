import '../tool-icon-button.js';
import './change-shape-button.js';
import './change-brush-button.js';
import './change-connector-button.js';
import './more-button.js';

import type {
  BrushElement,
  ConnectorElement,
  ShapeElement,
  SurfaceManager,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';

import { atLeastNMatches } from '../../../../__internal__/utils/std.js';
import type { TopLevelBlockModel } from '../../../../__internal__/utils/types.js';
import type { EdgelessSelectionSlots } from '../../edgeless-page-block.js';
import type { EdgelessSelectionState } from '../../selection-manager.js';
import type { Selectable } from '../../selection-manager.js';
import { isTopLevelBlock } from '../../utils.js';

type CategorizedElements = {
  shape: ShapeElement[];
  brush: BrushElement[];
  frame: TopLevelBlockModel[];
  connector: ConnectorElement[];
};

@customElement('edgeless-component-toolbar')
export class EdgelessComponentToolbar extends LitElement {
  static styles = css`
    :host {
      display: block;
      user-select: none;
    }

    .container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
    }

    menu-divider {
      height: 24px;
    }
  `;

  @property()
  selected: Selectable[] = [];

  @property({ type: Object })
  selectionState!: EdgelessSelectionState;

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  @property()
  slots!: EdgelessSelectionSlots;

  private _category(): CategorizedElements {
    const cate: Record<string, unknown[]> = {
      frame: [],
    };

    this.selected.forEach(s => {
      if (isTopLevelBlock(s)) {
        cate.frame.push(s);
        return;
      }
      if (!cate[s.type]) {
        cate[s.type] = [];
      }
      cate[s.type].push(s);
    });

    return cate as CategorizedElements;
  }

  private _getShapeButton(shapeElements?: ShapeElement[]) {
    const shapeButton = shapeElements?.length
      ? html`<edgeless-change-shape-button
          .elements=${shapeElements}
          .page=${this.page}
          .surface=${this.surface}
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

  render() {
    const categorized = this._category();
    const { shape, brush, connector } = categorized;

    // when selected types more than two, only show `more` button
    const selectedAtLeastTwoTypes = atLeastNMatches(
      Object.values(categorized),
      e => !!e.length,
      2
    );

    const buttons = selectedAtLeastTwoTypes
      ? []
      : [
          this._getShapeButton(shape),
          this._getBrushButton(brush),
          this._getConnectorButton(connector),
        ];

    const divider = selectedAtLeastTwoTypes
      ? nothing
      : html`<menu-divider .vertical=${true}></menu-divider>`;
    return html`<div class="container">
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
