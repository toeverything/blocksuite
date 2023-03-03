import '../tool-icon-button.js';
import './brush-menu.js';

import { PenIcon } from '@blocksuite/global/config';
import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { MouseMode } from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { EdgelessBrushMenu } from './brush-menu.js';

interface BrushMenuPopper {
  element: EdgelessBrushMenu;
  dispose: () => void;
}

function createBrushMenuPopper(reference: HTMLElement): BrushMenuPopper {
  const brushMenu = document.createElement('edgeless-brush-menu');
  document.body.appendChild(brushMenu);
  const popper = createPopper(reference, brushMenu, {
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
    element: brushMenu,
    dispose: () => {
      brushMenu.remove();
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

  private _brushMenu: BrushMenuPopper | null = null;

  private _toggleBrushMenu() {
    if (this._brushMenu) {
      this._brushMenu.dispose();
      this._brushMenu = null;
    } else {
      this._brushMenu = createBrushMenuPopper(this);
      this._brushMenu.element.mouseMode = this.mouseMode;
      this._brushMenu.element.edgeless = this.edgeless;
    }
  }

  private _trySetBrushMode() {
    if (this.mouseMode.type === 'brush') return;

    this.edgeless.signals.mouseModeUpdated.emit({
      type: 'brush',
      lineWidth: 4,
      color: '#010101',
    });
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('mouseMode')) {
      if (this.mouseMode.type !== 'brush') {
        this._brushMenu?.dispose();
        this._brushMenu = null;
      }
      if (this._brushMenu) {
        this._brushMenu.element.mouseMode = this.mouseMode;
        this._brushMenu.element.edgeless = this.edgeless;
      }
    }
  }

  render() {
    const type = this.mouseMode?.type;

    return html`
      <edgeless-tool-icon-button
        .tooltip=${'Pen'}
        .active=${type === 'brush'}
        @tool.click=${() => {
          this._trySetBrushMode();
          this._toggleBrushMenu();
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
