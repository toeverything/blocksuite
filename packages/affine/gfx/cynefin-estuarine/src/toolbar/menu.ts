import { DefaultTool } from '@blocksuite/affine-block-surface';
import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import { ShapeStyle } from '@blocksuite/affine-model';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import { css, html, LitElement } from 'lit';

import { REF_H as CYN_H, REF_W as CYN_W } from '../cynefin/consts';
import { REF_H as EST_H, REF_W as EST_W } from '../estuarine/consts';
import {
  cynefinMenuIcon,
  estuarineMenuIcon,
  hexagonMenuIcon,
} from './icons';

/** Estuarine map default size (REF aspect, scaled up so it reads on canvas). */
const MAP_SCALE = 1.2;
const HEX_SIZE = 60;
const HEX_FILL = '#34c724';
const HEX_STROKE = '#1f1f1f';
/** Flat-top regular hexagon, normalized vertices. */
const HEX_VERTICES: number[][] = [
  [1, 0.5],
  [0.75, 0.933],
  [0.25, 0.933],
  [0, 0.5],
  [0.25, 0.067],
  [0.75, 0.067],
];

/**
 * The popover above the toolbar hosting both frameworks: create the Cynefin
 * diagram, the Estuarine map, or a hexagon constraint node.
 */
export class EdgelessCynefinEstuarineMenu extends EdgelessToolbarToolMixin(
  LitElement
) {
  static override styles = css`
    :host {
      position: absolute;
      display: flex;
      z-index: -1;
    }
    .menu-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .button-group-container {
      display: flex;
      align-items: center;
      gap: 14px;
      fill: var(--affine-icon-color);
    }
    .button-group-container svg {
      width: 24px;
      height: 24px;
    }
  `;

  override type = EmptyTool;

  private _finish(id: string) {
    const { gfx } = this;
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });
  }

  private _createCynefin() {
    const { gfx } = this;
    if (!gfx.surface) return;
    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'cynefin',
      xywh: new Bound(
        centerX - CYN_W / 2,
        centerY - CYN_H / 2,
        CYN_W,
        CYN_H
      ).serialize(),
    });
    this._finish(id);
  }

  private _createMap() {
    const { gfx } = this;
    if (!gfx.surface) return;
    const width = EST_W * MAP_SCALE;
    const height = EST_H * MAP_SCALE;
    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'estuarine',
      xywh: new Bound(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height
      ).serialize(),
    });
    this._finish(id);
  }

  private _createHexagon() {
    const { gfx } = this;
    if (!gfx.surface) return;
    const { centerX: cx, centerY: cy } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'shape',
      shapeType: 'polygon',
      vertices: HEX_VERTICES,
      filled: true,
      fillColor: HEX_FILL,
      strokeColor: HEX_STROKE,
      strokeWidth: 2,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
      xywh: new Bound(
        cx - HEX_SIZE / 2,
        cy - HEX_SIZE / 2,
        HEX_SIZE,
        HEX_SIZE
      ).serialize(),
    });
    this._finish(id);
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Cynefin framework'}
              @click=${this._createCynefin}
            >
              ${cynefinMenuIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Estuarine map'}
              @click=${this._createMap}
            >
              ${estuarineMenuIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Hexagon node'}
              @click=${this._createHexagon}
            >
              ${hexagonMenuIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
