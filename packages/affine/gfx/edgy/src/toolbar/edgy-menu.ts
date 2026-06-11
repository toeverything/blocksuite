import { DefaultTool } from '@blocksuite/affine-block-surface';
import { createGroupCommand } from '@blocksuite/affine-gfx-group';
import { EmptyTool } from '@blocksuite/affine-gfx-pointer';
import { FontFamily, ShapeStyle } from '@blocksuite/affine-model';
import { EdgelessToolbarToolMixin } from '@blocksuite/affine-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import type { GfxController } from '@blocksuite/std/gfx';
import { css, html, LitElement } from 'lit';

import { REF_H, REF_W } from '../consts';
import {
  ACTIVITY_VERTICES,
  INNER_FONT_SIZE,
  LABEL_FONT_SIZE,
  LABEL_GAP,
  NODE_FILL,
  NODE_LABEL,
  NODE_SIZE,
  NODE_STROKE,
  NODE_STROKE_WIDTH,
  OUTCOME_RADIUS,
} from '../node/consts';
import {
  edgyActivityIcon,
  edgyFacetsIcon,
  edgyObjectIcon,
  edgyOutcomeIcon,
  edgyPeopleIcon,
} from './icons';

type Surface = NonNullable<GfxController['surface']>;
type BoxKind = 'outcome' | 'object' | 'activity';

/** Default facets-diagram size (REF aspect, scaled up so it reads on canvas). */
const FACETS_SCALE = 1.5;

/** Height of the native People free-text label. */
const LABEL_H = LABEL_FONT_SIZE + 8;

/**
 * The popover above the toolbar for the EDGY toolbox. Items create the facets
 * diagram (the on-click Venn) and the four base-element prefab shapes — all
 * native shapes so they stay editable.
 */
export class EdgelessEdgyMenu extends EdgelessToolbarToolMixin(LitElement) {
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

  /** Create the Enterprise Design Facets diagram centred on the viewport. */
  private _createFacets() {
    const { gfx } = this;
    if (!gfx.surface) return;

    const width = REF_W * FACETS_SCALE;
    const height = REF_H * FACETS_SCALE;
    const { centerX, centerY } = gfx.viewport;
    const id = gfx.surface.addElement({
      type: 'edgy',
      xywh: new Bound(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height
      ).serialize(),
    });
    this._finish(id);
  }

  /** Add a native free-text label (Inter), used for the People node. */
  private _addLabel(surface: Surface, text: string, x: number, y: number) {
    return surface.addElement({
      type: 'text',
      text,
      fontFamily: FontFamily.Inter,
      fontSize: LABEL_FONT_SIZE,
      color: NODE_STROKE,
      textAlign: 'center',
      xywh: new Bound(x, y, 120, LABEL_H).serialize(),
    });
  }

  private _group(ids: string[]) {
    const [, result] = this.edgeless.std.command.exec(createGroupCommand, {
      elements: ids,
    });
    return result.groupId || ids[0];
  }

  /** Shared props for an EDGY node shape. */
  private _baseShapeProps(kind: BoxKind | 'people') {
    return {
      type: 'edgyNode' as const,
      kind,
      filled: true,
      fillColor: NODE_FILL,
      strokeColor: NODE_STROKE,
      shapeStyle: ShapeStyle.General,
      roughness: 0,
    };
  }

  /** Create a box base element (outcome / object / activity) with inner text. */
  private _createBox(kind: BoxKind) {
    const surface = this.gfx.surface;
    if (!surface) return;

    const { w, h } = NODE_SIZE[kind];
    const { centerX: cx, centerY: cy } = this.gfx.viewport;
    const shapeType = kind === 'activity' ? 'polygon' : 'rect';

    const id = surface.addElement({
      ...this._baseShapeProps(kind),
      shapeType,
      strokeWidth: NODE_STROKE_WIDTH,
      radius: kind === 'outcome' ? OUTCOME_RADIUS : 0,
      vertices: kind === 'activity' ? ACTIVITY_VERTICES : null,
      text: NODE_LABEL[kind],
      color: NODE_STROKE,
      fontFamily: FontFamily.Inter,
      fontSize: INNER_FONT_SIZE,
      textAlign: 'center',
      xywh: new Bound(cx - w / 2, cy - h / 2, w, h).serialize(),
    });
    this._finish(id);
  }

  /**
   * Create the People base element: an (invisible) ellipse decorated with the
   * person glyph by the renderer, plus a native text label below, grouped.
   */
  private _createPeople() {
    const surface = this.gfx.surface;
    if (!surface) return;

    const { w, h } = NODE_SIZE.people;
    const { centerX: cx, centerY: cy } = this.gfx.viewport;

    const nodeId = surface.addElement({
      ...this._baseShapeProps('people'),
      shapeType: 'ellipse',
      // No visible outline — People is just the glyph; the ellipse is the bound.
      strokeWidth: 0,
      xywh: new Bound(cx - w / 2, cy - h / 2, w, h).serialize(),
    });
    const labelId = this._addLabel(
      surface,
      NODE_LABEL.people,
      cx - 60,
      cy + h / 2 + LABEL_GAP
    );

    this._finish(this._group([nodeId, labelId]));
  }

  private _finish(id: string) {
    const { gfx } = this;
    gfx.doc.captureSync();
    gfx.tool.setTool(DefaultTool);
    gfx.selection.set({ elements: [id], editing: false });
    // Keep the palette open (native sub-menu behaviour).
  }

  override render() {
    return html`
      <edgeless-slide-menu>
        <div class="menu-content">
          <div class="button-group-container">
            <edgeless-tool-icon-button
              .tooltip=${'Enterprise Design facets'}
              @click=${this._createFacets}
            >
              ${edgyFacetsIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'People'}
              @click=${this._createPeople}
            >
              ${edgyPeopleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Outcome'}
              @click=${() => this._createBox('outcome')}
            >
              ${edgyOutcomeIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Object'}
              @click=${() => this._createBox('object')}
            >
              ${edgyObjectIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Activity'}
              @click=${() => this._createBox('activity')}
            >
              ${edgyActivityIcon}
            </edgeless-tool-icon-button>
          </div>
        </div>
      </edgeless-slide-menu>
    `;
  }
}
