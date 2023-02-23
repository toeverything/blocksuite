import '../tool-icon-button.js';
import './shapes-menu.js';

import { ShapeIcon } from '@blocksuite/global/config';
import type { Disposable } from '@blocksuite/global/utils';
import { createPopper } from '@popperjs/core';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

function createShapesMenuPopper(reference: HTMLElement): Disposable {
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
    dispose: () => {
      shapeComponent.remove();
      popper.destroy();
    },
  };
}

@customElement('edgeless-shape-tool-button')
export class EdgelessShapeToolButton extends LitElement {
  private _disposeShapesMenu?: Disposable;

  private _toggleShapesMenu() {
    if (this._disposeShapesMenu) {
      this._disposeShapesMenu.dispose();
      this._disposeShapesMenu = undefined;
    } else {
      this._disposeShapesMenu = createShapesMenuPopper(this);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._disposeShapesMenu?.dispose?.();
    this._disposeShapesMenu = undefined;
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
