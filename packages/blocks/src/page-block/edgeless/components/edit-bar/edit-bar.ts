import '../tool-icon-button.js';
import './change-shape-button.js';

import { MoreHorizontalIcon } from '@blocksuite/global/config';
import type { ShapeElement, SurfaceManager } from '@blocksuite/phasor';
import type { Page } from '@blocksuite/store';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { Selectable } from '../../selection-manager.js';
import { isSurfaceElement } from '../../utils.js';

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
  `;

  @property()
  selected: Selectable[] = [];

  @property()
  page!: Page;

  @property()
  surface!: SurfaceManager;

  private _getShapeButton() {
    const shapeElements = this.selected.filter(s => {
      if (isSurfaceElement(s) && s.type === 'shape') {
        return true;
      }
      return false;
    }) as ShapeElement[];
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

  render() {
    const shapeButton = this._getShapeButton();

    return html`<div class="container">
      ${shapeButton}
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
