import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/stroke-style-panel.js';
import '../../edgeless/components/panel/color-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
  ConnectorEndpointNoneIcon,
  CurveLineIcon,
  ElbowedLineIcon,
  FlipDirectionIcon,
  FrontEndpointArrowIcon,
  FrontEndpointCircleIcon,
  FrontEndpointDiamondIcon,
  FrontEndpointTriangleIcon,
  GeneralStyleIcon,
  RearEndpointArrowIcon,
  RearEndpointCircleIcon,
  RearEndpointDiamondIcon,
  RearEndpointTriangleIcon,
  ScribbledStyleIcon,
  SmallArrowDownIcon,
  StraightLineIcon,
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth } from '../../../_common/types.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import type { PointStyle } from '../../../surface-block/index.js';
import {
  type ConnectorElementModel,
  ConnectorEndpoint,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  type StrokeStyle,
} from '../../../surface-block/index.js';
import type { LineStyleButtonProps } from '../../edgeless/components/buttons/line-style-button.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
} from '../../edgeless/components/panel/color-panel.js';
import type { LineStyleEvent } from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';

function getMostCommonColor(
  elements: ConnectorElementModel[]
): CssVariableName {
  const colors = countBy(elements, (ele: ConnectorElementModel) => ele.stroke);
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as CssVariableName) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonMode(
  elements: ConnectorElementModel[]
): ConnectorMode | null {
  const modes = countBy(elements, (ele: ConnectorElementModel) => ele.mode);
  const max = maxBy(Object.entries(modes), ([_k, count]) => count);
  return max ? (Number(max[0]) as ConnectorMode) : null;
}

function getMostCommonLineWidth(elements: ConnectorElementModel[]): LineWidth {
  const sizes = countBy(elements, (ele: ConnectorElementModel) => {
    return ele.strokeWidth;
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

export function getMostCommonLineStyle(
  elements: ConnectorElementModel[]
): LineStyleButtonProps['mode'] | null {
  const sizes = countBy(elements, (ele: ConnectorElementModel) => {
    switch (ele.strokeStyle) {
      case 'solid': {
        return 'solid';
      }
      case 'dash': {
        return 'dash';
      }
      case 'none': {
        return 'none';
      }
    }
  });
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as LineStyleButtonProps['mode']) : null;
}

function getMostCommonRough(elements: ConnectorElementModel[]): boolean {
  const { trueCount, falseCount } = elements.reduce(
    (counts, ele) => {
      if (ele.rough) {
        counts.trueCount++;
      } else {
        counts.falseCount++;
      }
      return counts;
    },
    { trueCount: 0, falseCount: 0 }
  );

  return trueCount > falseCount;
}

function getMostCommonEndpointStyle(
  elements: ConnectorElementModel[],
  end: ConnectorEndpoint
): PointStyle | null {
  const modes = countBy(elements, (ele: ConnectorElementModel) =>
    end === ConnectorEndpoint.Front
      ? ele.frontEndpointStyle
      : ele.rearEndpointStyle
  );
  const max = maxBy(Object.entries(modes), ([_k, count]) => count);
  return max ? (max[0] as PointStyle) : null;
}

@customElement('edgeless-change-connector-button')
export class EdgelessChangeConnectorButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  elements: ConnectorElementModel[] = [];

  get doc() {
    return this.edgeless.doc;
  }

  get service() {
    return this.edgeless.service;
  }

  private _setConnectorMode(mode: ConnectorMode) {
    this.doc.captureSync();
    this.elements.forEach(element => {
      if (element.mode !== mode) {
        this.service.updateElement(element.id, {
          mode,
        });
      }
    });
  }

  private _setConnectorRough(rough: boolean) {
    this.doc.captureSync();
    this.elements.forEach(element => {
      if (element.rough !== rough) {
        this.service.updateElement(element.id, {
          rough,
        });
      }
    });
  }

  private _setConnectorColor(stroke: CssVariableName) {
    this.doc.captureSync();

    let shouldUpdate = false;
    this.elements.forEach(element => {
      if (element.stroke !== stroke) {
        shouldUpdate = true;
        this.service.updateElement(element.id, {
          stroke,
        });
      }
    });
    if (shouldUpdate) this.requestUpdate();
  }

  private _setConnectorStrokeWidth(strokeWidth: number) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        strokeWidth,
      });
    });
  }

  private _setConnectorStrokeStyle(strokeStyle: StrokeStyle) {
    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        strokeStyle,
      });
    });
  }

  private _setConnectorStorke(e: LineStyleEvent) {
    if (e.type === 'size') {
      this._setConnectorStrokeWidth(e.value);
      return;
    }
    this._setConnectorStrokeStyle(e.value as StrokeStyle);
  }

  private _setConnectorPointStyle(end: ConnectorEndpoint, style: PointStyle) {
    this.elements.forEach(ele => {
      if (end === ConnectorEndpoint.Front) {
        this.service.updateElement(ele.id, {
          frontEndpointStyle: style,
        });
      } else {
        this.service.updateElement(ele.id, {
          rearEndpointStyle: style,
        });
      }
    });
  }

  private _flipEndpointStyle(
    frontEndpointStyle: PointStyle,
    rearEndpointStyle: PointStyle
  ) {
    if (frontEndpointStyle === rearEndpointStyle) return;

    this.elements.forEach(ele => {
      this.service.updateElement(ele.id, {
        frontEndpointStyle: rearEndpointStyle,
        rearEndpointStyle: frontEndpointStyle,
      });
    });
  }

  private _getEndpointIcon(end: ConnectorEndpoint, style: PointStyle) {
    switch (style) {
      case 'None': {
        return ConnectorEndpointNoneIcon;
      }
      case 'Arrow': {
        return end === ConnectorEndpoint.Front
          ? FrontEndpointArrowIcon
          : RearEndpointArrowIcon;
      }
      case 'Triangle': {
        return end === ConnectorEndpoint.Front
          ? FrontEndpointTriangleIcon
          : RearEndpointTriangleIcon;
      }
      case 'Circle': {
        return end === ConnectorEndpoint.Front
          ? FrontEndpointCircleIcon
          : RearEndpointCircleIcon;
      }
      case 'Diamond': {
        return end === ConnectorEndpoint.Front
          ? FrontEndpointDiamondIcon
          : RearEndpointDiamondIcon;
      }
    }
  }

  override render() {
    const selectedColor = getMostCommonColor(this.elements);
    const selectedMode = getMostCommonMode(this.elements);
    const selectedLineSize =
      getMostCommonLineWidth(this.elements) ?? LineWidth.Four;
    const selectedRough = getMostCommonRough(this.elements);
    const selectedLineStyle = getMostCommonLineStyle(this.elements);
    const selectedStartPointStyle =
      getMostCommonEndpointStyle(this.elements, ConnectorEndpoint.Front) ??
      DEFAULT_FRONT_END_POINT_STYLE;
    const selectedEndPointStyle =
      getMostCommonEndpointStyle(this.elements, ConnectorEndpoint.Rear) ??
      DEFAULT_REAR_END_POINT_STYLE;

    return html`<edgeless-menu-button
        .contentPadding=${'8px'}
        .button=${html`<edgeless-tool-icon-button
          aria-label="Stroke style"
          .tooltip=${'Stroke style'}
        >
          <edgeless-color-button
            .color=${selectedColor}
          ></edgeless-color-button>
        </edgeless-tool-icon-button>`}
      >
        <stroke-style-panel
          slot
          .strokeWidth=${selectedLineSize}
          .strokeStyle=${selectedLineStyle}
          .strokeColor=${selectedColor}
          .setStrokeStyle=${(e: LineStyleEvent) => this._setConnectorStorke(e)}
          .setStrokeColor=${(e: ColorEvent) =>
            this._setConnectorColor(e.detail)}
        >
        </stroke-style-panel>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Style"
          .tooltip=${'Style'}
        >
          ${selectedRough
            ? ScribbledStyleIcon
            : GeneralStyleIcon}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <div slot data-orientation="horizontal">
          <edgeless-tool-icon-button
            aria-label="General"
            .tooltip=${'General'}
            .active=${!selectedRough}
            .activeMode=${'background'}
            @click=${() => this._setConnectorRough(false)}
          >
            ${GeneralStyleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Scribbled"
            .tooltip=${'Scribbled'}
            .active=${selectedRough}
            .activeMode=${'background'}
            @click=${() => this._setConnectorRough(true)}
          >
            ${ScribbledStyleIcon}
          </edgeless-tool-icon-button>
        </div>
      </edgeless-menu-button>

      <edgeless-menu-divider></edgeless-menu-divider>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Start point style"
          .tooltip=${'Start point style'}
        >
          ${this._getEndpointIcon(
            ConnectorEndpoint.Front,
            selectedStartPointStyle
          )}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <div slot data-orientation="horizontal">
          <edgeless-tool-icon-button
            aria-label="None"
            .tooltip=${'None'}
            .active=${selectedStartPointStyle === 'None'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Front, 'None')}
          >
            ${ConnectorEndpointNoneIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Arrow"
            .tooltip=${'Arrow'}
            .active=${selectedStartPointStyle === 'Arrow'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Arrow')}
          >
            ${FrontEndpointArrowIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Triangle"
            .tooltip=${'Triangle'}
            .active=${selectedStartPointStyle === 'Triangle'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Triangle')}
          >
            ${FrontEndpointTriangleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Circle"
            .tooltip=${'Circle'}
            .active=${selectedStartPointStyle === 'Circle'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Circle')}
          >
            ${FrontEndpointCircleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Diamond"
            .tooltip=${'Diamond'}
            .active=${selectedStartPointStyle === 'Diamond'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Diamond')}
          >
            ${FrontEndpointDiamondIcon}
          </edgeless-tool-icon-button>
        </div>
      </edgeless-menu-button>

      <edgeless-tool-icon-button
        aria-label="Flip direction"
        .tooltip=${'Flip direction'}
        .disabled=${false}
        @click=${() =>
          this._flipEndpointStyle(
            selectedStartPointStyle,
            selectedEndPointStyle
          )}
      >
        ${FlipDirectionIcon}
      </edgeless-tool-icon-button>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="End point style"
          .tooltip=${'End point style'}
        >
          ${this._getEndpointIcon(
            ConnectorEndpoint.Rear,
            selectedEndPointStyle
          )}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <div slot data-orientation="horizontal">
          <edgeless-tool-icon-button
            aria-label="Diamond"
            .tooltip=${'Diamond'}
            .active=${selectedEndPointStyle === 'Diamond'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Diamond')}
          >
            ${RearEndpointDiamondIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Circle"
            .tooltip=${'Circle'}
            .active=${selectedEndPointStyle === 'Circle'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Circle')}
          >
            ${RearEndpointCircleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Triangle"
            .tooltip=${'Triangle'}
            .active=${selectedEndPointStyle === 'Triangle'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Triangle')}
          >
            ${RearEndpointTriangleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Arrow"
            .tooltip=${'Arrow'}
            .active=${selectedEndPointStyle === 'Arrow'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Arrow')}
          >
            ${RearEndpointArrowIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="None"
            .tooltip=${'None'}
            .active=${selectedEndPointStyle === 'None'}
            .activeMode=${'background'}
            @click=${() =>
              this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'None')}
          >
            ${ConnectorEndpointNoneIcon}
          </edgeless-tool-icon-button>
        </div>
      </edgeless-menu-button>

      <edgeless-menu-button
        .button=${html`<edgeless-tool-icon-button
          aria-label="Shape"
          .tooltip=${'Connector shape'}
        >
          ${selectedMode === ConnectorMode.Straight
            ? StraightLineIcon
            : selectedMode === ConnectorMode.Orthogonal
              ? ElbowedLineIcon
              : CurveLineIcon}${SmallArrowDownIcon}
        </edgeless-tool-icon-button>`}
      >
        <div slot data-orientation="horizontal">
          <edgeless-tool-icon-button
            aria-label="Straight"
            .tooltip=${'Straight'}
            .active=${selectedMode === ConnectorMode.Straight}
            .activeMode=${'background'}
            @click=${() => this._setConnectorMode(ConnectorMode.Straight)}
          >
            ${StraightLineIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Curve"
            .tooltip=${'Curve'}
            .active=${selectedMode === ConnectorMode.Curve}
            .activeMode=${'background'}
            @click=${() => this._setConnectorMode(ConnectorMode.Curve)}
          >
            ${CurveLineIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            aria-label="Elbowed"
            .tooltip=${'Elbowed'}
            .active=${selectedMode === ConnectorMode.Orthogonal}
            .activeMode=${'background'}
            @click=${() => this._setConnectorMode(ConnectorMode.Orthogonal)}
          >
            ${ElbowedLineIcon}
          </edgeless-tool-icon-button>
        </div>
      </edgeless-menu-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-change-connector-button': EdgelessChangeConnectorButton;
  }
}

export function renderConnectorButton(
  edgeless: EdgelessRootBlockComponent,
  elements?: ConnectorElementModel[]
) {
  if (!elements?.length) return nothing;

  return html`<edgeless-change-connector-button
    .elements=${elements}
    .edgeless=${edgeless}
  >
  </edgeless-change-connector-button>`;
}
