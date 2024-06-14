import '../../edgeless/components/buttons/tool-icon-button.js';
import '../../edgeless/components/buttons/menu-button.js';
import '../../edgeless/components/panel/stroke-style-panel.js';
import '../../edgeless/components/panel/color-panel.js';
import './change-text-menu.js';

import { WithDisposable } from '@blocksuite/block-std';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  AddTextIcon,
  ConnectorCWithArrowIcon,
  ConnectorEndpointNoneIcon,
  ConnectorLWithArrowIcon,
  ConnectorXWithArrowIcon,
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
} from '../../../_common/icons/index.js';
import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import { LineWidth } from '../../../_common/types.js';
import { countBy, maxBy } from '../../../_common/utils/iterable.js';
import type {
  ConnectorElementProps,
  ConnectorLabelProps,
} from '../../../surface-block/element-model/connector.js';
import type { PointStyle } from '../../../surface-block/index.js';
import {
  type ConnectorElementModel,
  ConnectorEndpoint,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  type StrokeStyle,
} from '../../../surface-block/index.js';
import { renderMenuDivider } from '../../edgeless/components/buttons/menu-button.js';
import {
  type ColorEvent,
  GET_DEFAULT_LINE_COLOR,
} from '../../edgeless/components/panel/color-panel.js';
import type { LineStyleEvent } from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { mountConnectorLabelEditor } from '../../edgeless/utils/text.js';

function getMostCommonColor(
  elements: ConnectorElementModel[]
): CssVariableName {
  const colors = countBy(elements, ele => ele.stroke);
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max ? (max[0] as CssVariableName) : GET_DEFAULT_LINE_COLOR();
}

function getMostCommonMode(
  elements: ConnectorElementModel[]
): ConnectorMode | null {
  const modes = countBy(elements, ele => ele.mode);
  const max = maxBy(Object.entries(modes), ([_k, count]) => count);
  return max ? (Number(max[0]) as ConnectorMode) : null;
}

function getMostCommonLineWidth(elements: ConnectorElementModel[]): LineWidth {
  const sizes = countBy(elements, ele => ele.strokeWidth);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (Number(max[0]) as LineWidth) : LineWidth.Four;
}

export function getMostCommonLineStyle(
  elements: ConnectorElementModel[]
): StrokeStyle | null {
  const sizes = countBy(elements, ele => ele.strokeStyle);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as StrokeStyle) : null;
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
  endpoint: ConnectorEndpoint
): PointStyle | null {
  const field =
    endpoint === ConnectorEndpoint.Front
      ? 'frontEndpointStyle'
      : 'rearEndpointStyle';
  const modes = countBy(elements, ele => ele[field]);
  const max = maxBy(Object.entries(modes), ([_k, count]) => count);
  return max ? (max[0] as PointStyle) : null;
}

function notEqual<
  K extends keyof Omit<ConnectorElementProps, keyof ConnectorLabelProps>,
>(key: K, value: ConnectorElementProps[K]) {
  return (element: ConnectorElementModel) => element[key] !== value;
}

interface EndpointStyle {
  value: PointStyle;
  icon: TemplateResult<1>;
}

const STYLE_LIST = [
  {
    name: 'General',
    value: false,
    icon: GeneralStyleIcon,
  },
  {
    name: 'Scribbled',
    value: true,
    icon: ScribbledStyleIcon,
  },
] as const;

const STYLE_CHOOSE: [boolean, () => TemplateResult<1>][] = [
  [false, () => GeneralStyleIcon],
  [true, () => ScribbledStyleIcon],
] as const;

const FRONT_ENDPOINT_STYLE_LIST: EndpointStyle[] = [
  {
    value: 'None',
    icon: ConnectorEndpointNoneIcon,
  },
  {
    value: 'Arrow',
    icon: FrontEndpointArrowIcon,
  },
  {
    value: 'Triangle',
    icon: FrontEndpointTriangleIcon,
  },
  {
    value: 'Circle',
    icon: FrontEndpointCircleIcon,
  },
  {
    value: 'Diamond',
    icon: FrontEndpointDiamondIcon,
  },
] as const;

const REAR_ENDPOINT_STYLE_LIST: EndpointStyle[] = [
  {
    value: 'Diamond',
    icon: RearEndpointDiamondIcon,
  },
  {
    value: 'Circle',
    icon: RearEndpointCircleIcon,
  },
  {
    value: 'Triangle',
    icon: RearEndpointTriangleIcon,
  },
  {
    value: 'Arrow',
    icon: RearEndpointArrowIcon,
  },
  {
    value: 'None',
    icon: ConnectorEndpointNoneIcon,
  },
] as const;

const MODE_LIST = [
  {
    name: 'Curve',
    icon: ConnectorCWithArrowIcon,
    value: ConnectorMode.Curve,
  },
  {
    name: 'Elbowed',
    icon: ConnectorXWithArrowIcon,
    value: ConnectorMode.Orthogonal,
  },
  {
    name: 'Straight',
    icon: ConnectorLWithArrowIcon,
    value: ConnectorMode.Straight,
  },
] as const;

const MODE_CHOOSE: [ConnectorMode, () => TemplateResult<1>][] = [
  [ConnectorMode.Curve, () => ConnectorCWithArrowIcon],
  [ConnectorMode.Orthogonal, () => ConnectorXWithArrowIcon],
  [ConnectorMode.Straight, () => ConnectorLWithArrowIcon],
] as const;

@customElement('edgeless-change-connector-button')
export class EdgelessChangeConnectorButton extends WithDisposable(LitElement) {
  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: ConnectorElementModel[] = [];

  get doc() {
    return this.edgeless.doc;
  }

  get service() {
    return this.edgeless.service;
  }

  private _setConnectorProp<
    K extends keyof Omit<ConnectorElementProps, keyof ConnectorLabelProps>,
  >(key: K, value: ConnectorElementProps[K]) {
    this.doc.captureSync();
    this.elements
      .filter(notEqual(key, value))
      .forEach(element =>
        this.service.updateElement(element.id, { [key]: value })
      );
  }

  private _setConnectorMode(mode: ConnectorMode) {
    this._setConnectorProp('mode', mode);
  }

  private _setConnectorRough(rough: boolean) {
    this._setConnectorProp('rough', rough);
  }

  private _setConnectorColor(stroke: CssVariableName) {
    this._setConnectorProp('stroke', stroke);
  }

  private _setConnectorStrokeWidth(strokeWidth: number) {
    this._setConnectorProp('strokeWidth', strokeWidth);
  }

  private _setConnectorStrokeStyle(strokeStyle: StrokeStyle) {
    this._setConnectorProp('strokeStyle', strokeStyle);
  }

  private _setConnectorStorke({ type, value }: LineStyleEvent) {
    if (type === 'size') {
      this._setConnectorStrokeWidth(value);
      return;
    }
    this._setConnectorStrokeStyle(value);
  }

  private _setConnectorPointStyle(end: ConnectorEndpoint, style: PointStyle) {
    const props = {
      [end === ConnectorEndpoint.Front
        ? 'frontEndpointStyle'
        : 'rearEndpointStyle']: style,
    };
    this.elements.forEach(element =>
      this.service.updateElement(element.id, { ...props })
    );
  }

  private _flipEndpointStyle(
    frontEndpointStyle: PointStyle,
    rearEndpointStyle: PointStyle
  ) {
    if (frontEndpointStyle === rearEndpointStyle) return;

    this.elements.forEach(element =>
      this.service.updateElement(element.id, {
        frontEndpointStyle: rearEndpointStyle,
        rearEndpointStyle: frontEndpointStyle,
      })
    );
  }

  private _getEndpointIcon(list: EndpointStyle[], style: PointStyle) {
    return (
      list.find(({ value }) => value === style)?.icon ||
      ConnectorEndpointNoneIcon
    );
  }

  private _addLabel() {
    mountConnectorLabelEditor(this.elements[0], this.edgeless);
  }

  private _showAddButtonOrTextMenu() {
    if (this.elements.length === 1 && !this.elements[0].text) {
      return 'button';
    }
    if (!this.elements.some(e => !e.text)) {
      return 'menu';
    }
    return 'nothing';
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

    return join(
      [
        html`
          <edgeless-menu-button
            .contentPadding=${'8px'}
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="Stroke style"
                .tooltip=${'Stroke style'}
              >
                <edgeless-color-button
                  .color=${selectedColor}
                ></edgeless-color-button>
              </edgeless-tool-icon-button>
            `}
          >
            <stroke-style-panel
              slot
              .strokeWidth=${selectedLineSize}
              .strokeStyle=${selectedLineStyle}
              .strokeColor=${selectedColor}
              .setStrokeStyle=${(e: LineStyleEvent) =>
                this._setConnectorStorke(e)}
              .setStrokeColor=${(e: ColorEvent) =>
                this._setConnectorColor(e.detail)}
            >
            </stroke-style-panel>
          </edgeless-menu-button>
        `,

        html`
          <edgeless-menu-button
            .button=${html`
              <edgeless-tool-icon-button aria-label="Style" .tooltip=${'Style'}>
                ${choose(selectedRough, STYLE_CHOOSE)}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            `}
          >
            <div slot data-orientation="horizontal">
              ${repeat(
                STYLE_LIST,
                item => item.name,
                ({ name, value, icon }) => html`
                  <edgeless-tool-icon-button
                    aria-label=${name}
                    .tooltip=${name}
                    .active=${selectedRough === value}
                    .activeMode=${'background'}
                    @click=${() => this._setConnectorRough(value)}
                  >
                    ${icon}
                  </edgeless-tool-icon-button>
                `
              )}
            </div>
          </edgeless-menu-button>
        `,

        html`
          <edgeless-menu-button
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="Start point style"
                .tooltip=${'Start point style'}
              >
                ${this._getEndpointIcon(
                  FRONT_ENDPOINT_STYLE_LIST,
                  selectedStartPointStyle
                )}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            `}
          >
            <div slot data-orientation="horizontal">
              ${repeat(
                FRONT_ENDPOINT_STYLE_LIST,
                item => item.value,
                ({ value, icon }) => html`
                  <edgeless-tool-icon-button
                    aria-label=${value}
                    .tooltip=${value}
                    .active=${selectedStartPointStyle === value}
                    .activeMode=${'background'}
                    @click=${() =>
                      this._setConnectorPointStyle(
                        ConnectorEndpoint.Front,
                        value
                      )}
                  >
                    ${icon}
                  </edgeless-tool-icon-button>
                `
              )}
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
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="End point style"
                .tooltip=${'End point style'}
              >
                ${this._getEndpointIcon(
                  REAR_ENDPOINT_STYLE_LIST,
                  selectedEndPointStyle
                )}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            `}
          >
            <div slot data-orientation="horizontal">
              ${repeat(
                REAR_ENDPOINT_STYLE_LIST,
                item => item.value,
                ({ value, icon }) => html`
                  <edgeless-tool-icon-button
                    aria-label=${value}
                    .tooltip=${value}
                    .active=${selectedEndPointStyle === value}
                    .activeMode=${'background'}
                    @click=${() =>
                      this._setConnectorPointStyle(
                        ConnectorEndpoint.Rear,
                        value
                      )}
                  >
                    ${icon}
                  </edgeless-tool-icon-button>
                `
              )}
            </div>
          </edgeless-menu-button>

          <edgeless-menu-button
            .button=${html`
              <edgeless-tool-icon-button
                aria-label="Shape"
                .tooltip=${'Connector shape'}
              >
                ${choose(selectedMode, MODE_CHOOSE)}${SmallArrowDownIcon}
              </edgeless-tool-icon-button>
            `}
          >
            <div slot data-orientation="horizontal">
              ${repeat(
                MODE_LIST,
                item => item.name,
                ({ name, value, icon }) => html`
                  <edgeless-tool-icon-button
                    aria-label=${name}
                    .tooltip=${name}
                    .active=${selectedMode === value}
                    .activeMode=${'background'}
                    @click=${() => this._setConnectorMode(value)}
                  >
                    ${icon}
                  </edgeless-tool-icon-button>
                `
              )}
            </div>
          </edgeless-menu-button>
        `,

        choose<string, TemplateResult<1> | typeof nothing>(
          this._showAddButtonOrTextMenu(),
          [
            [
              'button',
              () => html`
                <edgeless-tool-icon-button
                  aria-label="Add text"
                  .tooltip=${'Add text'}
                  @click=${this._addLabel}
                >
                  ${AddTextIcon}
                </edgeless-tool-icon-button>
              `,
            ],
            [
              'menu',
              () => html`
                <edgeless-change-text-menu
                  .elementType=${'connector'}
                  .elements=${this.elements}
                  .edgeless=${this.edgeless}
                ></edgeless-change-text-menu>
              `,
            ],
            ['nothing', () => nothing],
          ]
        ),
      ].filter(button => button !== nothing),
      renderMenuDivider
    );
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

  return html`
    <edgeless-change-connector-button
      .elements=${elements}
      .edgeless=${edgeless}
    >
    </edgeless-change-connector-button>
  `;
}
