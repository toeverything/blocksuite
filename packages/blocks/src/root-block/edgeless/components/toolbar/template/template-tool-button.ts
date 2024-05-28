import './template-panel.js';

import {
  arrow,
  autoUpdate,
  computePosition,
  offset,
  shift,
} from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { EdgelessTool } from '../../../../../_common/types.js';
import { once } from '../../../../../_common/utils/event.js';
import { EdgelessToolbarToolMixin } from '../mixins/tool.mixin.js';
import { renderIcon } from './icon.js';
import type { EdgelessTemplatePanel } from './template-panel.js';

@customElement('edgeless-template-button')
export class EdgelessTemplateButton extends EdgelessToolbarToolMixin(
  LitElement
) {
  override _type: EdgelessTool['type'] = 'template';
  static override styles = css`
    :host {
      position: relative;
    }

    edgeless-template-button {
      cursor: pointer;
    }

    .icon {
      width: 102px;
      height: 64px;
      overflow: hidden;
      position: relative;
      color: var(--affine-background-primary-color);
    }
  `;

  private _openedPanel: EdgelessTemplatePanel | null = null;
  private _cleanup: (() => void) | null = null;

  private _togglePanel() {
    if (this._openedPanel) {
      this._closePanel();
      return;
    }

    const panel = document.createElement('edgeless-templates-panel');
    panel.edgeless = this.edgeless;

    this._cleanup = once(panel, 'closepanel', () => {
      this._closePanel();
    });
    this._openedPanel = panel;

    this.renderRoot.append(panel);

    requestAnimationFrame(() => {
      const arrowEl = panel.renderRoot.querySelector('.arrow') as HTMLElement;

      autoUpdate(this, panel, () => {
        computePosition(this, panel, {
          placement: 'top',
          middleware: [offset(20), arrow({ element: arrowEl }), shift()],
        })
          .then(({ x, y, middlewareData }) => {
            panel.style.left = `${x}px`;
            panel.style.top = `${y}px`;

            arrowEl.style.left = `${
              (middlewareData.arrow?.x ?? 0) - (middlewareData.shift?.x ?? 0)
            }px`;
          })
          .catch(e => {
            console.warn("Can't compute position", e);
          });
      });
    });
  }

  private _closePanel() {
    if (this._openedPanel) {
      this._openedPanel.remove();
      this._openedPanel = null;
      this._cleanup?.();
      this._cleanup = null;
      this.requestUpdate();
    }
  }

  private _renderIcon(expanded: boolean) {
    return html`<div class="icon">${renderIcon(expanded)}</div>`;
  }

  override render() {
    const expanded = this._openedPanel !== null;

    return html`<edgeless-toolbar-button @click=${this._togglePanel}>
      ${this._renderIcon(expanded)}
    </edgeless-toolbar-button>`;
  }
}
