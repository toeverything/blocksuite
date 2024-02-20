import '../buttons/tool-icon-button.js';

import { assertExists } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import { Workspace } from '@blocksuite/store';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  FrameIcon,
  SmallNoteIcon,
} from '../../../../_common/icons/edgeless.js';
import { FontFamilyIcon } from '../../../../_common/icons/text.js';
import { type Connection } from '../../../../surface-block/element-model/connector.js';
import {
  type ConnectorElementModel,
  type ShapeElementModel,
  TextElementModel,
} from '../../../../surface-block/element-model/index.js';
import {
  Bound,
  clamp,
  GroupElementModel,
  normalizeDegAngle,
  serializeXYWH,
  toDegree,
  Vec,
  type XYWH,
} from '../../../../surface-block/index.js';
import { captureEventTarget } from '../../../widgets/drag-handle/utils.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { DEFAULT_NOTE_WIDTH } from '../../utils/consts.js';
import {
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../../utils/text.js';
import { ShapeComponentConfig } from '../toolbar/shape/shape-menu-config.js';
import {
  type AUTO_COMPLETE_TARGET_TYPE,
  AutoCompleteFrameOverlay,
  AutoCompleteNoteOverlay,
  AutoCompleteShapeOverlay,
  AutoCompleteTextOverlay,
  capitalizeFirstLetter,
  createShapeElement,
  createTextElement,
  DEFAULT_NOTE_BACKGROUND_COLOR,
  DEFAULT_NOTE_OVERLAY_HEIGHT,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  Direction,
  NOTE_BACKGROUND_COLOR_MAP,
  PANEL_HEIGHT,
  PANEL_OFFSET,
  PANEL_WIDTH,
  type TARGET_SHAPE_TYPE,
} from './utils.js';

@customElement('edgeless-auto-complete-panel')
export class EdgelessAutoCompletePanel extends WithDisposable(LitElement) {
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
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: 1;
    }

    .row-button {
      width: 120px;
      height: 20px;
      padding: 4px 0;
      text-align: center;
      border-radius: 4px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      font-size: 13px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
    }
  `;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent;

  @property({ attribute: false })
  position: [number, number];

  @property({ attribute: false })
  currentShape: ShapeElementModel;

  @property({ attribute: false })
  connector: ConnectorElementModel;

  private _overlay:
    | AutoCompleteShapeOverlay
    | AutoCompleteNoteOverlay
    | AutoCompleteFrameOverlay
    | AutoCompleteTextOverlay
    | null = null;

  private _generateTarget(connector: ConnectorElementModel) {
    const currentShape = this.currentShape;
    const bound = Bound.deserialize(currentShape.xywh);
    const { w, h } = bound;
    const point = connector.target.position;
    assertExists(point);

    const len = connector.path.length;
    const angle = normalizeDegAngle(
      toDegree(Vec.angle(connector.path[len - 2], connector.path[len - 1]))
    );
    let nextBound: Bound;
    let position: Connection['position'];
    // direction of the connector target arrow
    let direction: Direction;

    if (angle >= 45 && angle <= 135) {
      nextBound = new Bound(point[0] - w / 2, point[1], w, h);
      position = [0.5, 0];
      direction = Direction.Bottom;
    } else if (angle >= 135 && angle <= 225) {
      nextBound = new Bound(point[0] - w, point[1] - h / 2, w, h);
      position = [1, 0.5];
      direction = Direction.Left;
    } else if (angle >= 225 && angle <= 315) {
      nextBound = new Bound(point[0] - w / 2, point[1] - h, w, h);
      position = [0.5, 1];
      direction = Direction.Top;
    } else {
      nextBound = new Bound(point[0], point[1] - h / 2, w, h);
      position = [0, 0.5];
      direction = Direction.Right;
    }

    return { nextBound, position, direction };
  }

  private _getTargetXYWH(width: number, height: number) {
    const result = this._generateTarget(this.connector);
    if (!result) return null;

    const { nextBound: bound, direction, position } = result;
    if (!bound) return null;

    const { w, h } = bound;
    let x = bound.x;
    let y = bound.y;

    switch (direction) {
      case Direction.Right:
        y += h / 2 - height / 2;
        break;
      case Direction.Bottom:
        x -= width / 2 - w / 2;
        break;
      case Direction.Left:
        y += h / 2 - height / 2;
        x -= width - w;
        break;
      case Direction.Top:
        x -= width / 2 - w / 2;
        y += h - height;
        break;
    }

    const xywh = [x, y, width, height] as XYWH;

    return { xywh, position };
  }

  private _connectorExist() {
    return !!this.edgeless.service.getElementById(this.connector.id);
  }

  private _showTextOverlay() {
    const xywh = this._getTargetXYWH(
      DEFAULT_TEXT_WIDTH,
      DEFAULT_TEXT_HEIGHT
    )?.xywh;
    if (!xywh) return;

    this._overlay = new AutoCompleteTextOverlay(xywh);
    this.edgeless.surface.renderer.addOverlay(this._overlay);
  }

  private _showNoteOverlay() {
    const xywh = this._getTargetXYWH(
      DEFAULT_NOTE_WIDTH,
      DEFAULT_NOTE_OVERLAY_HEIGHT
    )?.xywh;
    if (!xywh) return;

    const fillColor = this.currentShape.fillColor;
    const computedStyle = getComputedStyle(this.edgeless);
    const backgroundColor = computedStyle.getPropertyValue(
      NOTE_BACKGROUND_COLOR_MAP.get(fillColor) ?? DEFAULT_NOTE_BACKGROUND_COLOR
    );
    this._overlay = new AutoCompleteNoteOverlay(xywh, backgroundColor);
    this.edgeless.surface.renderer.addOverlay(this._overlay);
  }

  private _showFrameOverlay() {
    const bound = this._generateTarget(this.connector)?.nextBound;
    if (!bound) return;

    const { h } = bound;
    const w = h / 0.75;
    const xywh = this._getTargetXYWH(w, h)?.xywh;
    if (!xywh) return;

    const computedStyle = getComputedStyle(this.edgeless);
    const strokeColor = computedStyle.getPropertyValue('--affine-black-30');
    this._overlay = new AutoCompleteFrameOverlay(xywh, strokeColor);
    this.edgeless.surface.renderer.addOverlay(this._overlay);
  }

  private _showShapeOverlay(targetType: TARGET_SHAPE_TYPE) {
    const bound = this._generateTarget(this.connector)?.nextBound;
    if (!bound) return;

    const { x, y, w, h } = bound;
    const xywh = [x, y, w, h] as XYWH;
    const { shapeStyle, roughness, strokeColor, fillColor, strokeWidth } =
      this.currentShape;
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

    this.edgeless.surface.renderer.addOverlay(this._overlay);
  }

  private _showOverlay(targetType: AUTO_COMPLETE_TARGET_TYPE) {
    this._removeOverlay();
    if (!this._connectorExist()) return;

    switch (targetType) {
      case 'text':
        this._showTextOverlay();
        break;
      case 'note':
        this._showNoteOverlay();
        break;
      case 'frame':
        this._showFrameOverlay();
        break;
      default:
        this._showShapeOverlay(targetType);
    }

    this.edgeless.surface.refresh();
  }

  private _removeOverlay() {
    if (this._overlay)
      this.edgeless.surface.renderer.removeOverlay(this._overlay);
  }

  private _addShape(targetType: TARGET_SHAPE_TYPE) {
    const edgeless = this.edgeless;
    const currentShape = this.currentShape;
    const result = this._generateTarget(this.connector);
    if (!result) return;

    const { nextBound, position } = result;
    const { service } = edgeless;
    const id = createShapeElement(edgeless, currentShape, targetType);

    service.updateElement(id, { xywh: nextBound.serialize() });
    service.updateElement(this.connector.id, {
      target: { id, position },
    });

    mountShapeTextEditor(
      service.getElementById(id) as ShapeElementModel,
      this.edgeless
    );
    edgeless.service.selection.set({
      elements: [id],
      editing: true,
    });
    edgeless.page.captureSync();
  }

  private _addNote() {
    const { page } = this.edgeless;
    const service = this.edgeless.service!;
    const target = this._getTargetXYWH(
      DEFAULT_NOTE_WIDTH,
      DEFAULT_NOTE_OVERLAY_HEIGHT
    );
    if (!target) return;

    const { xywh, position } = target;
    const fillColor = this.currentShape.fillColor;
    const backgroundColor =
      NOTE_BACKGROUND_COLOR_MAP.get(fillColor) ?? DEFAULT_NOTE_BACKGROUND_COLOR;

    const id = service!.addBlock(
      'affine:note',
      {
        xywh: serializeXYWH(...xywh),
        background: backgroundColor,
      },
      page.root?.id
    );
    page.addBlock('affine:paragraph', { type: 'text' }, id);
    const group = this.currentShape.group;

    if (group instanceof GroupElementModel) {
      group.addChild(id);
    }
    this.connector.target = {
      id,
      position: position as [number, number],
    };
    service.updateElement(this.connector.id, {
      target: { id, position },
    });
    this.edgeless.service.selection.set({
      elements: [id],
      editing: true,
    });
  }

  private _addFrame() {
    const bound = this._generateTarget(this.connector)?.nextBound;
    if (!bound) return;

    const { h } = bound;
    const w = h / 0.75;
    const target = this._getTargetXYWH(w, h);
    if (!target) return;

    const { xywh, position } = target;

    const edgeless = this.edgeless;
    const { service, surfaceBlockModel } = edgeless;
    const frameIndex = service.layer.frames.length + 1;
    const id = service.addBlock(
      'affine:frame',
      {
        title: new Workspace.Y.Text(`Frame ${frameIndex}`),
        xywh: serializeXYWH(...xywh),
      },
      surfaceBlockModel
    );
    edgeless.page.captureSync();
    const frame = service.getElementById(id);
    assertExists(frame);

    this.connector.target = {
      id,
      position,
    };

    edgeless.service.selection.set({
      elements: [frame.id],
      editing: false,
    });
  }

  private _addText() {
    const target = this._getTargetXYWH(DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT);
    if (!target) return;

    const { xywh, position } = target;
    const id = createTextElement(this.edgeless, this.currentShape);
    const { service } = this.edgeless;

    service.updateElement(id, { xywh: serializeXYWH(...xywh) });
    service.updateElement(this.connector.id, {
      target: { id, position },
    });
    this.edgeless.service.selection.set({
      elements: [id],
      editing: false,
    });
    this.edgeless.page.captureSync();
    const textElement = this.edgeless.service.getElementById(id);
    assertExists(textElement);
    if (textElement instanceof TextElementModel) {
      mountTextElementEditor(textElement, this.edgeless);
    }
  }

  private _autoComplete(targetType: AUTO_COMPLETE_TARGET_TYPE) {
    this._removeOverlay();
    if (!this._connectorExist()) return;

    switch (targetType) {
      case 'text':
        this._addText();
        break;
      case 'note':
        this._addNote();
        break;
      case 'frame':
        this._addFrame();
        break;
      default:
        this._addShape(targetType);
    }

    this.remove();
  }

  private _getPanelPosition() {
    const { viewport } = this.edgeless.service;
    const viewportRect = viewport.boundingClientRect;
    let [x, y] = viewport.toViewCoord(...this.position);
    const { width, height } = viewportRect;
    // if connector target position is out of viewport, don't show the panel
    if (x <= 0 || x >= width || y <= 0 || y >= height) return null;

    x += PANEL_OFFSET.x;
    y += PANEL_OFFSET.y;
    x = clamp(x, 20, width - 20 - PANEL_WIDTH);
    y = clamp(y, 20, height - 20 - PANEL_HEIGHT);
    return [x, y] as [number, number];
  }

  constructor(
    position: [number, number],
    edgeless: EdgelessPageBlockComponent,
    currentShape: ShapeElementModel,
    connector: ConnectorElementModel
  ) {
    super();
    this.position = position;
    this.edgeless = edgeless;
    this.currentShape = currentShape;
    this.connector = connector;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.edgeless.handleEvent('click', ctx => {
      const { target } = ctx.get('pointerState').raw;
      const element = captureEventTarget(target);
      const clickAway = !element?.closest('edgeless-auto-complete-panel');
      if (clickAway) this.remove();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._removeOverlay();
  }

  override firstUpdated() {
    this.disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() =>
        this.requestUpdate()
      )
    );
  }

  override render() {
    const position = this._getPanelPosition();
    if (!position) return nothing;

    const style = styleMap({
      left: `${position[0]}px`,
      top: `${position[1]}px`,
    });
    const shapeStyle = this.currentShape.shapeStyle;
    const currentShapeType =
      this.currentShape.shapeType !== 'rect'
        ? this.currentShape.shapeType
        : this.currentShape.radius
          ? 'roundedRect'
          : 'rect';

    const shapeButtons = html`${ShapeComponentConfig.map(
      ({ name, generalIcon, scribbledIcon, tooltip }) => {
        return html`
          <edgeless-tool-icon-button
            .tooltip=${tooltip}
            .iconContainerPadding=${2}
            @pointerenter=${() => this._showOverlay(name)}
            @pointerleave=${() => this._removeOverlay()}
            @click=${() => this._autoComplete(name)}
          >
            ${shapeStyle === 'General' ? generalIcon : scribbledIcon}
          </edgeless-tool-icon-button>
        `;
      }
    )}`;

    return html`<div class="auto-complete-panel-container" style=${style}>
      ${shapeButtons}

      <edgeless-tool-icon-button
        .tooltip=${'Text'}
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('text')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${() => this._autoComplete('text')}
      >
        ${FontFamilyIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Note'}
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('note')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${() => this._autoComplete('note')}
      >
        ${SmallNoteIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .tooltip=${'Frame'}
        .iconContainerPadding=${2}
        @pointerenter=${() => this._showOverlay('frame')}
        @pointerleave=${() => this._removeOverlay()}
        @click=${() => this._autoComplete('frame')}
      >
        ${FrameIcon}
      </edgeless-tool-icon-button>

      <edgeless-tool-icon-button
        .tooltip=${capitalizeFirstLetter(currentShapeType)}
        .iconContainerPadding=${0}
        @pointerenter=${() => this._showOverlay(currentShapeType)}
        @pointerleave=${() => this._removeOverlay()}
        @click=${() => this._autoComplete(currentShapeType)}
      >
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
