import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/color-panel.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ConnectorEndpointNoneIcon,
  CurveLineIcon,
  DashLineIcon,
  ElbowedLineIcon,
  FlipDirectionIcon,
  FrontEndpointArrowIcon,
  FrontEndpointCircleIcon,
  FrontEndpointDiamondIcon,
  FrontEndpointTriangleIcon,
  GeneralStyleIcon,
  LineStyleIcon,
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
  StrokeStyle,
} from '../../../surface-block/index.js';
import type { LineStyleButtonProps } from '../../edgeless/components/buttons/line-style-button.js';
import {
  type ColorEvent,
  ColorUnit,
  GET_DEFAULT_LINE_COLOR,
} from '../../edgeless/components/panel/color-panel.js';
import type { LineWidthEvent } from '../../edgeless/components/panel/line-width-panel.js';
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
  static override styles = [
    css`
      :host {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        color: var(--affine-text-primary-color);
        fill: currentColor;
      }

      menu-divider {
        height: 24px;
      }

      .connector-style-sub-menu {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
    `,
  ];

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

    return html`
      <edgeless-menu-button
        .padding=${4}
        class="connector-color-button"
        .iconInfo=${{
          icon: html`${ColorUnit(selectedColor)}`,
          tooltip: 'Color',
        }}
        .menuChildren=${html` <edgeless-color-panel
          .value=${selectedColor}
          @select=${(e: ColorEvent) => this._setConnectorColor(e.detail)}
        >
        </edgeless-color-panel>`}
      ></edgeless-menu-button>

      <menu-divider .vertical=${true} .dividerMargin=${12}></menu-divider>

      <edgeless-menu-button
        class="line-styles-button"
        .padding=${8}
        .gap=${8}
        .iconInfo=${{
          icon: html`${LineStyleIcon}${SmallArrowDownIcon}`,
          tooltip: 'Border style',
        }}
        .menuChildren=${html`
          <edgeless-line-width-panel
            .selectedSize=${selectedLineSize as LineWidth}
            @select=${(e: LineWidthEvent) => {
              this._setConnectorStrokeWidth(e.detail);
            }}
          ></edgeless-line-width-panel>
          <menu-divider
            .vertical=${true}
            .dividerMargin=${2}
            style=${styleMap({ height: '24px' })}
          ></menu-divider>
          <edgeless-tool-icon-button
            class=${`edgeless-component-line-style-button-${StrokeStyle.Solid}`}
            .tooltip=${'Solid'}
            .active=${selectedLineStyle === StrokeStyle.Solid}
            .activeMode=${'background'}
            .iconContainerPadding=${2}
            @click=${() => this._setConnectorStrokeStyle(StrokeStyle.Solid)}
          >
            ${StraightLineIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            class=${`edgeless-component-line-style-button-${StrokeStyle.Dashed}`}
            .tooltip=${'Dash'}
            .active=${selectedLineStyle === StrokeStyle.Dashed}
            .activeMode=${'background'}
            .iconContainerPadding=${2}
            @click=${() => this._setConnectorStrokeStyle(StrokeStyle.Dashed)}
          >
            ${DashLineIcon}
          </edgeless-tool-icon-button>
        `}
      >
      </edgeless-menu-button>

      <menu-divider .vertical=${true} .dividerMargin=${12}></menu-divider>

      <edgeless-menu-button
        .padding=${8}
        .gap=${8}
        .iconInfo=${{
          icon: html`${selectedRough
            ? ScribbledStyleIcon
            : GeneralStyleIcon}${SmallArrowDownIcon}`,
          tooltip: 'Style',
        }}
        .menuChildren=${html`
          <edgeless-tool-icon-button
            .tooltip=${'General'}
            .iconContainerPadding=${2}
            .active=${!selectedRough}
            .activeMode=${'background'}
            @click=${() => this._setConnectorRough(false)}
          >
            ${GeneralStyleIcon}
          </edgeless-tool-icon-button>
          <edgeless-tool-icon-button
            .tooltip=${'Scribbled'}
            .active=${selectedRough}
            .activeMode=${'background'}
            .iconContainerPadding=${2}
            @click=${() => this._setConnectorRough(true)}
          >
            ${ScribbledStyleIcon}
          </edgeless-tool-icon-button>
        `}
      >
      </edgeless-menu-button>

      <menu-divider .vertical=${true} .dividerMargin=${12}></menu-divider>

      <div class="connector-style-sub-menu">
        <edgeless-menu-button
          .padding=${8}
          .gap=${8}
          .iconInfo=${{
            icon: html`${this._getEndpointIcon(
              ConnectorEndpoint.Front,
              selectedStartPointStyle
            )}${SmallArrowDownIcon}`,
            tooltip: 'Start Point Style',
          }}
          .menuChildren=${html`
            <edgeless-tool-icon-button
              .tooltip=${'None'}
              .iconContainerPadding=${2}
              .active=${selectedStartPointStyle === 'None'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Front, 'None')}
            >
              ${ConnectorEndpointNoneIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Arrow'}
              .iconContainerPadding=${2}
              .active=${selectedStartPointStyle === 'Arrow'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Arrow')}
            >
              ${FrontEndpointArrowIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Triangle'}
              .iconContainerPadding=${2}
              .active=${selectedStartPointStyle === 'Triangle'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(
                  ConnectorEndpoint.Front,
                  'Triangle'
                )}
            >
              ${FrontEndpointTriangleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Circle'}
              .iconContainerPadding=${2}
              .active=${selectedStartPointStyle === 'Circle'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Front, 'Circle')}
            >
              ${FrontEndpointCircleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Diamond'}
              .iconContainerPadding=${2}
              .active=${selectedStartPointStyle === 'Diamond'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(
                  ConnectorEndpoint.Front,
                  'Diamond'
                )}
            >
              ${FrontEndpointDiamondIcon}
            </edgeless-tool-icon-button>
          `}
        >
        </edgeless-menu-button>

        <edgeless-tool-icon-button
          .tooltip=${'Flip Direction'}
          .iconContainerPadding=${2}
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
          .padding=${8}
          .gap=${8}
          .iconInfo=${{
            icon: html`${this._getEndpointIcon(
              ConnectorEndpoint.Rear,
              selectedEndPointStyle
            )}${SmallArrowDownIcon}`,
            tooltip: 'End Point Style',
          }}
          .menuChildren=${html`
            <edgeless-tool-icon-button
              .tooltip=${'Diamond'}
              .iconContainerPadding=${2}
              .active=${selectedEndPointStyle === 'Diamond'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Diamond')}
            >
              ${RearEndpointDiamondIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Circle'}
              .iconContainerPadding=${2}
              .active=${selectedEndPointStyle === 'Circle'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Circle')}
            >
              ${RearEndpointCircleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Triangle'}
              .iconContainerPadding=${2}
              .active=${selectedEndPointStyle === 'Triangle'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(
                  ConnectorEndpoint.Rear,
                  'Triangle'
                )}
            >
              ${RearEndpointTriangleIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Arrow'}
              .iconContainerPadding=${2}
              .active=${selectedEndPointStyle === 'Arrow'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'Arrow')}
            >
              ${RearEndpointArrowIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'None'}
              .iconContainerPadding=${2}
              .active=${selectedEndPointStyle === 'None'}
              .activeMode=${'background'}
              @click=${() =>
                this._setConnectorPointStyle(ConnectorEndpoint.Rear, 'None')}
            >
              ${ConnectorEndpointNoneIcon}
            </edgeless-tool-icon-button>
          `}
        >
        </edgeless-menu-button>

        <edgeless-menu-button
          .padding=${8}
          .gap=${8}
          .iconInfo=${{
            icon: html`${selectedMode === ConnectorMode.Straight
              ? StraightLineIcon
              : selectedMode === ConnectorMode.Orthogonal
                ? ElbowedLineIcon
                : CurveLineIcon}${SmallArrowDownIcon}`,
            tooltip: 'Connector Shape',
          }}
          .menuChildren=${html`
            <edgeless-tool-icon-button
              .tooltip=${'Straight'}
              .iconContainerPadding=${2}
              .active=${selectedMode === ConnectorMode.Straight}
              .activeMode=${'background'}
              @click=${() => this._setConnectorMode(ConnectorMode.Straight)}
            >
              ${StraightLineIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Curve'}
              .iconContainerPadding=${2}
              .active=${selectedMode === ConnectorMode.Curve}
              .activeMode=${'background'}
              @click=${() => this._setConnectorMode(ConnectorMode.Curve)}
            >
              ${CurveLineIcon}
            </edgeless-tool-icon-button>
            <edgeless-tool-icon-button
              .tooltip=${'Elbowed'}
              .iconContainerPadding=${2}
              .active=${selectedMode === ConnectorMode.Orthogonal}
              .activeMode=${'background'}
              @click=${() => this._setConnectorMode(ConnectorMode.Orthogonal)}
            >
              ${ElbowedLineIcon}
            </edgeless-tool-icon-button>
          `}
        >
        </edgeless-menu-button>
      </div>
    `;
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
