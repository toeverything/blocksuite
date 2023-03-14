import '../tool-icon-button.js';
import './change-shape-button.js';
import './change-brush-button.js';

import { MoreHorizontalIcon } from '@blocksuite/global/config';
import type {
  BrushElement,
  ShapeElement,
  SurfaceManager,
} from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { TopLevelBlockModel } from '../../../../__internal__/utils/types.js';
import type { Selectable } from '../../selection-manager.js';
import { isPhasorElement, isTopLevelBlock } from '../../utils.js';

type CategorizedElements = {
  shape: ShapeElement[];
  brush: BrushElement[];
  frame: TopLevelBlockModel[];
};

@customElement('edgeless-edit-bar')
export class EdgelessEditBar extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--affine-page-background);
      box-shadow: 0 0 12px rgba(66, 65, 73, 0.14);
      border-radius: 8px;
    }

    common-divider {
      height: 24px;
    }
  `;

  @property()
  selected: Selectable[] = [];

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  private _category(): CategorizedElements {
    const cate = {
      shape: [],
      brush: [],
      frame: [],
    } as CategorizedElements;

    this.selected.forEach(s => {
      if (isTopLevelBlock(s)) {
        cate.frame.push(s);
        return;
      }
      if (s.type === 'shape') {
        cate.shape.push(s);
        return;
      }
      if (s.type === 'brush') {
        cate.brush.push(s);
      }
    });

    return cate;
  }

  private _getShapeButton(shapeElements: ShapeElement[]) {
    const shapeButton = shapeElements.length
      ? html`<edgeless-change-shape-button
          .elements=${shapeElements}
          .page=${this.page}
          .surface=${this.surface}
        >
        </edgeless-change-shape-button>`
      : null;
    return shapeButton;
  }

  private _getBrushButton(brushElements: BrushElement[]) {
    return brushElements.length
      ? html`<edgeless-change-brush-button
          .elements=${brushElements}
          .page=${this.page}
          .surface=${this.surface}
        >
        </edgeless-change-brush-button>`
      : null;
  }

  render() {
    const { shape, brush } = this._category();
    const shapeButton = this._getShapeButton(shape);
    const brushButton = this._getBrushButton(brush);
    const divider =
      shapeButton || brushButton
        ? html`<common-divider .vertical=${true}></common-divider>`
        : nothing;

    return html`<div class="container">
      ${shapeButton} ${brushButton} ${divider}
      <edgeless-tool-icon-button
        .disabled=${true}
        .tooltip=${'More'}
        .active=${false}
        @tool.click=${() => console.log('More')}
      >
        ${MoreHorizontalIcon}
      </edgeless-tool-icon-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-edit-bar': EdgelessEditBar;
  }
}
