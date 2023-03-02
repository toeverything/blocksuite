import '../tool-icon-button.js';
import './brush-menu.js';

import { PenIcon } from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessBrushToolMenu } from './brush-menu.js';

interface BrushToolMenuPopper {
  element: EdgelessBrushToolMenu;
  dispose: () => void;
}

function createBrushToolMenuPopper(
  reference: HTMLElement
): BrushToolMenuPopper {
  const brushToolMenu = document.createElement('edgeless-brush-tool-menu');
  document.body.appendChild(brushToolMenu);
  const popper = createPopper(reference, brushToolMenu, {
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
    element: brushToolMenu,
    dispose: () => {
      brushToolMenu.remove();
      popper.destroy();
    },
  };
}

@customElement('edgeless-brush-tool-button')
export class EdgelessBrushToolButton extends LitElement {
  static styles = css`
    :host {
      display: flex;
    }
  `;

  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _brushToolMenu: BrushToolMenuPopper | null = null;

  private _toggleBrushToolMenu() {
    if (this._brushToolMenu) {
      this._brushToolMenu.dispose();
      this._brushToolMenu = null;
    } else {
      this._brushToolMenu = createBrushToolMenuPopper(this);
      this._brushToolMenu.element.mouseMode = this.mouseMode;
      this._brushToolMenu.element.edgeless = this.edgeless;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      if (this.mouseMode.type !== 'brush') {
        this._brushToolMenu?.dispose();
        this._brushToolMenu = null;
      }
      if (this._brushToolMenu) {
        this._brushToolMenu.element.mouseMode = this.mouseMode;
        this._brushToolMenu.element.edgeless = this.edgeless;
      }
    }
  }

  private _setMouseMode() {
    this.edgeless.signals.mouseModeUpdated.emit({
      type: 'brush',
      lineWidth: 4,
      color: '#000000',
    });
  }

  render() {
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Pen'}
        .active=${type === 'brush'}
        @tool.click=${() => {
          this._setMouseMode();
          this._toggleBrushToolMenu();
        }}
      >
        ${PenIcon}
      </edgeless-tool-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-button': EdgelessBrushToolButton;
  }
}
