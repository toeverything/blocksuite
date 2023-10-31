import '../buttons/tool-icon-button.js';

import { assertExists } from '@blocksuite/global/utils';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  DiamondIcon,
  EllipseIcon,
  FrameIcon,
  RoundedRectangleIcon,
  SmallNoteIcon,
  SquareIcon,
  TriangleIcon,
} from '../../../../_common/icons/edgeless.js';
import { FontFamilyIcon } from '../../../../_common/icons/text.js';
import { captureEventTarget } from '../../../../_common/widgets/drag-handle/utils.js';
import {
  Bound,
  type Connection,
  type ConnectorElement,
  normalizeDegAngle,
  type PhasorElementType,
  type ShapeElement,
  type ShapeType,
  toDegree,
  Vec,
  type XYWH,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import {
  AutoCompleteShapeOverlay,
  createShapeElement,
  type Direction,
  isShape,
} from './utils.js';

@customElement('edgeless-auto-complete-panel')
export class EdgelessAutoCompletePanel extends LitElement {
  static override styles = css`
    .auto-complete-panel-container {
      position: absolute;
      display: flex;
      width: 136px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      padding: 8px 0;
      gap: 8px;
      border-radius: 8px;
      background: var(
        --light-background-background-overlay-panel-color,
        #fbfbfc
      );
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-popper-index);
    }

    .row-button {
      width: 120px;
      height: 20px;
      padding: 4px 0;
      text-align: center;
      border-radius: 4px;
      color: var(--light-text-color-text-primary-color, #424149);
      font-family: Inter;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
      border: 1px solid var(--light-detail-color-border-color, #e3e2e4);
    }
  `;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent;

  @property({ attribute: false })
  position: { x: number; y: number };

  @property({ attribute: false })
  type: Direction;

  @property({ attribute: false })
  current: ShapeElement;

  @property({ attribute: false })
  connector: ConnectorElement;

  private _overlay: AutoCompleteShapeOverlay | null = null;

  private async _generateShapeOnDrag(
    connector: ConnectorElement,
    targetType: ShapeType
  ) {
    const edgeless = this.edgeless;
    const current = this.current;
    const result = this._generateNextShapeBound(connector);
    if (!isShape(current) || !result) return;

    const { nextBound, position } = result;
    const { surface } = edgeless;
    const id = await createShapeElement(edgeless, current, targetType);

    surface.updateElement(id, { xywh: nextBound.serialize() });
    surface.updateElement<PhasorElementType.CONNECTOR>(connector.id, {
      target: { id, position },
    });
    edgeless.selectionManager.setSelection({
      elements: [id],
      editing: false,
    });
    edgeless.page.captureSync();
  }

  private _generateNextShapeBound(connector: ConnectorElement) {
    const current = this.current;
    if (!isShape(current)) return;

    const bound = Bound.deserialize(current.xywh);
    const { w, h } = bound;
    const point = connector.target.position;
    assertExists(point);

    const len = connector.path.length;
    const angle = normalizeDegAngle(
      toDegree(Vec.angle(connector.path[len - 2], connector.path[len - 1]))
    );
    let nextBound: Bound;
    let position: Connection['position'];

    if (angle >= 45 && angle <= 135) {
      nextBound = new Bound(point[0] - w / 2, point[1], w, h);
      position = [0.5, 0];
    } else if (angle >= 135 && angle <= 225) {
      nextBound = new Bound(point[0] - w, point[1] - h / 2, w, h);
      position = [1, 0.5];
    } else if (angle >= 225 && angle <= 315) {
      nextBound = new Bound(point[0] - w / 2, point[1] - h, w, h);
      position = [0.5, 1];
    } else {
      nextBound = new Bound(point[0], point[1] - h / 2, w, h);
      position = [0, 0.5];
    }

    return { nextBound, position };
  }

  private _showOverlay(targetType: ShapeType) {
    const current = this.current;
    if (!isShape(current)) return;

    // const bound = this.edgelessAutoComplete.computeNextBound(this.type);
    const bound = this._generateNextShapeBound(this.connector)?.nextBound;
    if (!bound) return;

    this._removeOverlay();

    const { x, y, w, h } = bound;
    const xywh = [x, y, w, h] as XYWH;
    const { shapeStyle, roughness, strokeColor, fillColor, strokeWidth } =
      current;
    const computedStyle = getComputedStyle(this.edgeless);
    const stroke = computedStyle.getPropertyValue(strokeColor);
    const fill = computedStyle.getPropertyValue(fillColor);

    const options = {
      seed: 666,
      roughness: roughness,
      strokeLineDash: [0, 0],
      stroke,
      strokeWidth,
      fill,
    };

    this._overlay = new AutoCompleteShapeOverlay(
      xywh,
      targetType,
      options,
      shapeStyle
    );

    this.edgeless.surface.viewport.addOverlay(this._overlay);
    this.edgeless.surface.refresh();
  }

  private _removeOverlay() {
    if (this._overlay)
      this.edgeless.surface.viewport.removeOverlay(this._overlay);
  }

  private _autoComplete(e: PointerEvent, targetType: ShapeType) {
    this._generateShapeOnDrag(this.connector, targetType);
    this._removeOverlay();
    this.remove();
  }

  constructor(
    position: { x: number; y: number },
    edgeless: EdgelessPageBlockComponent,
    type: Direction,
    current: ShapeElement,
    connector: ConnectorElement
  ) {
    super();
    console.log('constructor');
    this.position = position;
    this.edgeless = edgeless;
    this.type = type;
    this.current = current;
    this.connector = connector;
  }

  override connectedCallback() {
    super.connectedCallback();
    console.log('connectedCallback');
    this.edgeless.handleEvent('click', ctx => {
      const { target } = ctx.get('pointerState').raw;
      const element = captureEventTarget(target);
      const clickAway = !element?.closest('edgeless-auto-complete-panel');
      if (clickAway) this.remove();
    });
  }

  override render() {
    const style = styleMap({
      left: `${this.position?.x}px`,
      top: `${this.position?.y}px`,
    });
    return html`<div class="auto-complete-panel-container" style=${style}>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('ellipse')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => this._autoComplete(e, 'ellipse')}
      >
        ${EllipseIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('diamond')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => this._autoComplete(e, 'diamond')}
      >
        ${DiamondIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('triangle')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => this._autoComplete(e, 'triangle')}
      >
        ${TriangleIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('rect')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => this._autoComplete(e, 'rect')}
      >
        ${RoundedRectangleIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('rect')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => this._autoComplete(e, 'rect')}
      >
        ${SquareIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button .iconContainerPadding=${2}>
        ${FontFamilyIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button .iconContainerPadding=${2}>
        ${SmallNoteIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button .iconContainerPadding=${2}>
        ${FrameIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button .iconContainerPadding=${0}>
        <div class="row-button">Add a same object</div>
      </edgeless-tool-icon-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-auto-complete-panel': EdgelessAutoCompletePanel;
  }
}
