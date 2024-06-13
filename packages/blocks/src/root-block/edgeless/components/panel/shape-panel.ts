import '../buttons/tool-icon-button.js';

import { Slot } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { ShapeStyle } from '../../../../surface-block/index.js';
import type { ShapeTool } from '../../controllers/tools/shape-tool.js';
import { ShapeComponentConfig } from '../toolbar/shape/shape-menu-config.js';

@customElement('edgeless-shape-panel')
export class EdgelessShapePanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `;

  @property({ attribute: false })
  accessor selectedShape: ShapeTool['shapeType'] | null | undefined = undefined;

  @property({ attribute: false })
  accessor shapeStyle: ShapeStyle = ShapeStyle.Scribbled;

  slots = {
    select: new Slot<ShapeTool['shapeType']>(),
  };

  private _onSelect(value: ShapeTool['shapeType']) {
    this.selectedShape = value;
    this.slots.select.emit(value);
  }

  override disconnectedCallback(): void {
    this.slots.select.dispose();
    super.disconnectedCallback();
  }

  override render() {
    return repeat(
      ShapeComponentConfig,
      item => item.name,
      ({ name, generalIcon, scribbledIcon, tooltip, disabled }) =>
        html`<edgeless-tool-icon-button
          .disabled=${disabled}
          .tooltip=${tooltip}
          .active=${this.selectedShape === name}
          .activeMode=${'background'}
          @click=${() => {
            if (disabled) return;
            this._onSelect(name);
          }}
        >
          ${this.shapeStyle === ShapeStyle.General
            ? generalIcon
            : scribbledIcon}
        </edgeless-tool-icon-button>`
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-panel': EdgelessShapePanel;
  }
}
