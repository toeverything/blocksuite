import '../tool-icon-button.js';
import './shape-menu.js';

import { ShapeIcon } from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessShapeMenu } from './shape-menu.js';

interface ShapeMenuPopper {
  element: EdgelessShapeMenu;
  dispose: () => void;
}

function createShapeMenuPopper(reference: HTMLElement): ShapeMenuPopper {
  const shapeMenu = document.createElement('edgeless-shape-menu');
  document.body.appendChild(shapeMenu);
  const popper = createPopper(reference, shapeMenu, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ],
  });

  return {
    element: shapeMenu,
    dispose: () => {
      shapeMenu.remove();
      popper.destroy();
    },
  };
}

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends LitElement {
  static styles = css`
    :host {
      display: flex;
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _shapeMenu: ShapeMenuPopper | null = null;

  private _toggleShapeMenu() {
    if (this._shapeMenu) {
      this._shapeMenu.dispose();
      this._shapeMenu = null;
    } else {
      this._shapeMenu = createShapeMenuPopper(this);
      this._shapeMenu.element.mouseMode = this.mouseMode;
      this._shapeMenu.element.edgeless = this.edgeless;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      this._shapeMenu?.dispose();
      this._shapeMenu = null;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._shapeMenu?.dispose?.();
    this._shapeMenu = null;
  }

  render() {
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Shape'}
        .active=${type === 'shape'}
        .testId=${'shape'}
        @tool.click=${() => this._toggleShapeMenu()}
      >
        ${ShapeIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-tool-button': EdgelessShapeToolButton;
  }
}
