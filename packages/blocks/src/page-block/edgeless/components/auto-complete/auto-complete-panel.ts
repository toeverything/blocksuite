import '../buttons/tool-icon-button.js';

import { assertExists } from '@blocksuite/global/utils';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  FrameIcon,
  SmallNoteIcon,
} from '../../../../_common/icons/edgeless.js';
import { FontFamilyIcon } from '../../../../_common/icons/text.js';
import { Point } from '../../../../_common/utils/index.js';
import { captureEventTarget } from '../../../../_common/widgets/drag-handle/utils.js';
import {
  Bound,
  type Connection,
  type ConnectorElement,
  GroupElement,
  normalizeDegAngle,
  type PhasorElementType,
  type ShapeElement,
  ShapeStyle,
  type ShapeType,
  TextElement,
  toDegree,
  Vec,
  type XYWH,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { DEFAULT_NOTE_WIDTH } from '../../utils/consts.js';
import {
  mountShapeTextEditor,
  mountTextElementEditor,
} from '../../utils/text.js';
import { ShapeComponentConfig } from '../toolbar/shape/shape-menu-config.js';
import {
  AutoCompleteShapeOverlay,
  createShapeElement,
  createTextElement,
  type Direction,
  isShape,
  type TARGET_SHAPE_TYPE,
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
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-popper-index);
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
    targetType: TARGET_SHAPE_TYPE
  ) {
    const edgeless = this.edgeless;
    const current = this.current;
    const result = this._generateTarget(connector);
    if (!isShape(current) || !result) return;

    const { nextBound, position } = result;
    const { surface } = edgeless;
    const id = await createShapeElement(edgeless, current, targetType);

    surface.updateElement(id, { xywh: nextBound.serialize() });
    surface.updateElement<PhasorElementType.CONNECTOR>(connector.id, {
      target: { id, position },
    });

    mountShapeTextEditor(surface.pickById(id) as ShapeElement, this.edgeless);
    edgeless.selectionManager.setSelection({
      elements: [id],
      editing: true,
    });
    edgeless.page.captureSync();
  }

  private _generateTarget(connector: ConnectorElement) {
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

  private _showOverlay(targetType: TARGET_SHAPE_TYPE) {
    const current = this.current;
    if (!isShape(current)) return;

    // const bound = this.edgelessAutoComplete.computeNextBound(this.type);
    const bound = this._generateTarget(this.connector)?.nextBound;
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

  private _autoComplete(e: PointerEvent, targetType: TARGET_SHAPE_TYPE) {
    e.preventDefault();

    this._generateShapeOnDrag(this.connector, targetType);
    this._removeOverlay();
    this.remove();
  }

  private async _addText() {
    const result = this._generateTarget(this.connector);
    if (!result) return;

    const { nextBound, position } = result;
    if (!nextBound) return;

    const { x, h } = nextBound;
    const y = nextBound.y + h / 2;
    const id = await createTextElement(this.edgeless, this.current);

    const { surface } = this.edgeless;
    const newBound = new Bound(x, y, 32, 32);
    surface.updateElement(id, { xywh: newBound.serialize() });
    surface.updateElement<PhasorElementType.CONNECTOR>(this.connector.id, {
      target: { id, position },
    });
    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: false,
    });
    this.edgeless.page.captureSync();
    const textElement = this.edgeless.surface.pickById(id);
    assertExists(textElement);
    if (textElement instanceof TextElement) {
      mountTextElementEditor(textElement, this.edgeless);
    }

    // this._removeOverlay();
    this.remove();
  }

  private _addNote() {
    const { page, surface } = this.edgeless;
    const result = this._generateTarget(this.connector);
    if (!result) return;

    const { nextBound, position } = result;
    if (!nextBound) return;

    // TODO: need to accurate note position
    const { x, h } = nextBound;
    const y = nextBound.y + h / 2;
    const viewportPosition = surface.viewport.toViewCoord(x + 40, y);
    const point = new Point(...viewportPosition);

    const id = this.edgeless.addNoteWithPoint(point, {
      width: DEFAULT_NOTE_WIDTH,
    });
    page.addBlock('affine:paragraph', { type: 'text' }, id);

    const group = surface.pickById(surface.getGroupParent(this.current));
    if (group instanceof GroupElement) {
      surface.group.addChild(group, id);
    }

    surface.updateElement<PhasorElementType.CONNECTOR>(this.connector.id, {
      target: { id, position },
    });

    this.edgeless.selectionManager.setSelection({
      elements: [id],
      editing: true,
    });

    // this._removeOverlay();
    this.remove();
  }

  private _addFrame() {
    console.log('add frame');
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
    const shapeStyle = this.current?.shapeStyle;
    const currentShapeType =
      this.current.shapeType !== 'rect'
        ? this.current.shapeType
        : this.current.radius
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
            @click=${(e: PointerEvent) => {
              this._autoComplete(e, name);
            }}
          >
            ${shapeStyle === ShapeStyle.General ? generalIcon : scribbledIcon}
          </edgeless-tool-icon-button>
        `;
      }
    )}`;

    return html`<div class="auto-complete-panel-container" style=${style}>
      ${shapeButtons}

      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @click=${() => {
          this._addText();
        }}
      >
        ${FontFamilyIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button
        .iconContainerPadding=${2}
        @click=${() => {
          this._addNote();
        }}
      >
        ${SmallNoteIcon}
      </edgeless-tool-icon-button>
      <edgeless-tool-icon-button .iconContainerPadding=${2}>
        ${FrameIcon}
      </edgeless-tool-icon-button>

      <edgeless-tool-icon-button
        .iconContainerPadding=${0}
        @pointerenter=${() => {
          this._showOverlay(currentShapeType);
        }}
        @pointerleave=${() => this._removeOverlay()}
        @click=${(e: PointerEvent) => {
          this._autoComplete(e, currentShapeType);
        }}
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
