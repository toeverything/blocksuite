import '../tool-icon-button.js';
import './shapes-menu.js';

import { ShapeIcon } from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { EdgelessShapesMenu } from './shapes-menu.js';

interface ShapesMenuInstance {
  element: EdgelessShapesMenu;
  dispose: () => void;
}

function createShapesMenuPopper(reference: HTMLElement): ShapesMenuInstance {
  const shapeComponent = document.createElement('edgeless-shapes-menu');
  document.body.appendChild(shapeComponent);
  const popper = createPopper(reference, shapeComponent, {
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
    element: shapeComponent,
    dispose: () => {
      shapeComponent.remove();
      popper.destroy();
    },
  };
}

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends LitElement {
  private _shapesMenu?: ShapesMenuInstance;

  private _toggleShapesMenu() {
    if (this._shapesMenu) {
      this._shapesMenu.dispose();
      this._shapesMenu = undefined;
    } else {
      this._shapesMenu = createShapesMenuPopper(this);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._shapesMenu?.dispose?.();
    this._shapesMenu = undefined;
  }

  render() {
    return html`
      <edgeless-tool-icon-button @tool.click=${this._toggleShapesMenu}>
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
