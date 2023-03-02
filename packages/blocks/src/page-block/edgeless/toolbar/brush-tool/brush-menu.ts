import './color-panel.js';

import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type {
  BrushMouseMode,
  MouseMode,
} from '../../../../__internal__/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import type { SelectEvent } from './color-panel.js';

@customElement('edgeless-brush-tool-menu')
export class EdgelessBrushToolMenu extends LitElement {
  @property()
  mouseMode!: MouseMode;

  @property()
  edgeless!: EdgelessPageBlockComponent;

  private _setMouseMode(mode: BrushMouseMode) {
    this.edgeless.signals.mouseModeUpdated.emit(mode);
  }

  render() {
    if (this.mouseMode.type !== 'brush') {
      return nothing;
    }
    const { color, lineWidth } = this.mouseMode;

    return html`<div>
      <edgeless-color-panel
        value=${color}
        @select=${(e: SelectEvent) =>
          this._setMouseMode({ type: 'brush', color: e.detail, lineWidth })}
      ></edgeless-color-panel>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-brush-tool-menu': EdgelessBrushToolMenu;
  }
}
