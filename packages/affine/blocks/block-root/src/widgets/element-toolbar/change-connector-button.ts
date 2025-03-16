import { EdgelessCRUDIdentifier } from '@blocksuite/affine-block-surface';
import type {
  EdgelessColorPickerButton,
  PickColorEvent,
} from '@blocksuite/affine-components/color-picker';
import { packColor } from '@blocksuite/affine-components/color-picker';
import { renderToolbarSeparator } from '@blocksuite/affine-components/toolbar';
import {
  type ColorScheme,
  type ConnectorElementModel,
  type ConnectorElementProps,
  ConnectorEndpoint,
  type ConnectorLabelProps,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  DefaultTheme,
  LineWidth,
  PointStyle,
  resolveColor,
  StrokeStyle,
} from '@blocksuite/affine-model';
import { FeatureFlagService } from '@blocksuite/affine-shared/services';
import { WithDisposable } from '@blocksuite/global/lit';
import {
  AddTextIcon,
  ConnectorCIcon,
  ConnectorEIcon,
  ConnectorLIcon,
  EndPointArrowIcon,
  EndPointCircleIcon,
  EndPointDiamondIcon,
  EndPointTriangleIcon,
  FlipDirectionIcon,
  StartPointArrowIcon,
  StartPointCircleIcon,
  StartPointDiamondIcon,
  StartPointIcon,
  StartPointTriangleIcon,
  StyleGeneralIcon,
  StyleScribbleIcon,
} from '@blocksuite/icons/lit';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { join } from 'lit/directives/join.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import countBy from 'lodash-es/countBy';
import maxBy from 'lodash-es/maxBy';

import {
  type LineStyleEvent,
  LineStylesPanel,
} from '../../edgeless/components/panel/line-styles-panel.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import { mountConnectorLabelEditor } from '../../edgeless/utils/text.js';
import { SmallArrowDownIcon } from './icons.js';

function getMostCommonColor(
  elements: ConnectorElementModel[],
  colorScheme: ColorScheme
): string {
  const colors = countBy(elements, (ele: ConnectorElementModel) =>
    resolveColor(ele.stroke, colorScheme)
  );
  const max = maxBy(Object.entries(colors), ([_k, count]) => count);
  return max
    ? (max[0] as string)
    : resolveColor(DefaultTheme.connectorColor, colorScheme);
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
): StrokeStyle {
  const sizes = countBy(elements, ele => ele.strokeStyle);
  const max = maxBy(Object.entries(sizes), ([_k, count]) => count);
  return max ? (max[0] as StrokeStyle) : StrokeStyle.Solid;
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
  endpoint: ConnectorEndpoint,
  fallback: PointStyle
): PointStyle {
  const field =
    endpoint === ConnectorEndpoint.Front
      ? 'frontEndpointStyle'
      : 'rearEndpointStyle';
  const modes = countBy(elements, ele => ele[field]);
  const max = maxBy(Object.entries(modes), ([_k, count]) => count);
  return max ? (max[0] as PointStyle) : fallback;
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

const iconSize = { width: '20px', height: '20px' };
const STYLE_LIST = [
  {
    name: 'General',
    value: false,
    icon: StyleGeneralIcon(iconSize),
  },
  {
    name: 'Scribbled',
    value: true,
    icon: StyleScribbleIcon(iconSize),
  },
] as const;

const STYLE_CHOOSE: [boolean, () => TemplateResult<1>][] = [
  [false, () => StyleGeneralIcon(iconSize)],
  [true, () => StyleScribbleIcon(iconSize)],
] as const;

const FRONT_ENDPOINT_STYLE_LIST: EndpointStyle[] = [
  {
    value: PointStyle.None,
    icon: StartPointIcon(),
  },
  {
    value: PointStyle.Arrow,
    icon: StartPointArrowIcon(),
  },
  {
    value: PointStyle.Triangle,
    icon: StartPointTriangleIcon(),
  },
  {
    value: PointStyle.Circle,
    icon: StartPointCircleIcon(),
  },
  {
    value: PointStyle.Diamond,
    icon: StartPointDiamondIcon(),
  },
] as const;

const REAR_ENDPOINT_STYLE_LIST: EndpointStyle[] = [
  {
    value: PointStyle.Diamond,
    icon: EndPointDiamondIcon(),
  },
  {
    value: PointStyle.Circle,
    icon: EndPointCircleIcon(),
  },
  {
    value: PointStyle.Triangle,
    icon: EndPointTriangleIcon(),
  },
  {
    value: PointStyle.Arrow,
    icon: EndPointArrowIcon(),
  },
  {
    value: PointStyle.None,
    icon: StartPointIcon(),
  },
] as const;

const MODE_LIST = [
  {
    name: 'Curve',
    icon: ConnectorCIcon(),
    value: ConnectorMode.Curve,
  },
  {
    name: 'Elbowed',
    icon: ConnectorEIcon(),
    value: ConnectorMode.Orthogonal,
  },
  {
    name: 'Straight',
    icon: ConnectorLIcon(),
    value: ConnectorMode.Straight,
  },
] as const;

const MODE_CHOOSE: [ConnectorMode, () => TemplateResult<1>][] = [
  [ConnectorMode.Curve, () => ConnectorCIcon()],
  [ConnectorMode.Orthogonal, () => ConnectorEIcon()],
  [ConnectorMode.Straight, () => ConnectorLIcon()],
] as const;

export class EdgelessChangeConnectorButton extends WithDisposable(LitElement) {
  get crud() {
    return this.edgeless.std.get(EdgelessCRUDIdentifier);
  }

  private readonly _setConnectorStroke = ({ type, value }: LineStyleEvent) => {
    if (type === 'size') {
      this._setConnectorStrokeWidth(value);
      return;
    }
    this._setConnectorStrokeStyle(value);
  };

  pickColor = (e: PickColorEvent) => {
    const field = 'stroke';

    if (e.type === 'pick') {
      const color = e.detail.value;
      this.elements.forEach(ele => {
        const props = packColor(field, color);
        this.crud.updateElement(ele.id, props);
      });
      return;
    }

    this.elements.forEach(ele =>
      ele[e.type === 'start' ? 'stash' : 'pop'](field)
    );
  };

  get doc() {
    return this.edgeless.doc;
  }

  get service() {
    return this.edgeless.service;
  }

  private _addLabel() {
    mountConnectorLabelEditor(this.elements[0], this.edgeless);
  }

  private _flipEndpointStyle(
    frontEndpointStyle: PointStyle,
    rearEndpointStyle: PointStyle
  ) {
    if (frontEndpointStyle === rearEndpointStyle) return;

    this.elements.forEach(element =>
      this.crud.updateElement(element.id, {
        frontEndpointStyle: rearEndpointStyle,
        rearEndpointStyle: frontEndpointStyle,
      })
    );
  }

  private _getEndpointIcon(list: EndpointStyle[], style: PointStyle) {
    return list.find(({ value }) => value === style)?.icon || StartPointIcon();
  }

  private _setConnectorMode(mode: ConnectorMode) {
    this._setConnectorProp('mode', mode);
  }

  private _setConnectorPointStyle(end: ConnectorEndpoint, style: PointStyle) {
    const props = {
      [end === ConnectorEndpoint.Front
        ? 'frontEndpointStyle'
        : 'rearEndpointStyle']: style,
    };
    this.elements.forEach(element =>
      this.crud.updateElement(element.id, { ...props })
    );
  }

  private _setConnectorProp<
    K extends keyof Omit<ConnectorElementProps, keyof ConnectorLabelProps>,
  >(key: K, value: ConnectorElementProps[K]) {
    this.doc.captureSync();
    this.elements
      .filter(notEqual(key, value))
      .forEach(element =>
        this.crud.updateElement(element.id, { [key]: value })
      );
  }

  private _setConnectorRough(rough: boolean) {
    this._setConnectorProp('rough', rough);
  }

  private _setConnectorStrokeStyle(strokeStyle: StrokeStyle) {
    this._setConnectorProp('strokeStyle', strokeStyle);
  }

  private _setConnectorStrokeWidth(strokeWidth: number) {
    this._setConnectorProp('strokeWidth', strokeWidth);
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
    const colorScheme = this.edgeless.surface.renderer.getColorScheme();
    const elements = this.elements;
    const selectedColor = getMostCommonColor(elements, colorScheme);
    const selectedMode = getMostCommonMode(elements);
    const selectedLineSize = getMostCommonLineWidth(elements);
    const selectedRough = getMostCommonRough(elements);
    const selectedLineStyle = getMostCommonLineStyle(elements);
    const selectedStartPointStyle = getMostCommonEndpointStyle(
      elements,
      ConnectorEndpoint.Front,
      DEFAULT_FRONT_END_POINT_STYLE
    );
    const selectedEndPointStyle = getMostCommonEndpointStyle(
      elements,
      ConnectorEndpoint.Rear,
      DEFAULT_REAR_END_POINT_STYLE
    );
    const enableCustomColor = this.edgeless.doc
      .get(FeatureFlagService)
      .getFlag('enable_color_picker');

    return join(
      [
        html`
          <edgeless-color-picker-button
            class="stroke-color"
            .label="${'Stroke style'}"
            .pick=${this.pickColor}
            .color=${selectedColor}
            .theme=${colorScheme}
            .hollowCircle=${true}
            .originalColor=${elements[0].stroke}
            .enableCustomColor=${enableCustomColor}
          >
            <div
              slot="other"
              class="line-styles"
              style=${styleMap({
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                alignItems: 'center',
              })}
            >
              ${LineStylesPanel({
                selectedLineSize: selectedLineSize,
                selectedLineStyle: selectedLineStyle,
                onClick: this._setConnectorStroke,
              })}
            </div>
            <editor-toolbar-separator
              slot="separator"
              data-orientation="horizontal"
            ></editor-toolbar-separator>
          </edgeless-color-picker-button>
        `,

        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Style"
                .tooltip=${'Style'}
                .iconSize=${'20px'}
              >
                ${choose(selectedRough, STYLE_CHOOSE)}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <div>
              ${repeat(
                STYLE_LIST,
                item => item.name,
                ({ name, value, icon }) => html`
                  <editor-icon-button
                    aria-label=${name}
                    .tooltip=${name}
                    .active=${selectedRough === value}
                    .activeMode=${'background'}
                    .iconSize=${'20px'}
                    @click=${() => this._setConnectorRough(value)}
                  >
                    ${icon}
                  </editor-icon-button>
                `
              )}
            </div>
          </editor-menu-button>
        `,

        html`
          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Start point style"
                .tooltip=${'Start point style'}
                .iconSize=${'20px'}
              >
                ${this._getEndpointIcon(
                  FRONT_ENDPOINT_STYLE_LIST,
                  selectedStartPointStyle
                )}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <div>
              ${repeat(
                FRONT_ENDPOINT_STYLE_LIST,
                item => item.value,
                ({ value, icon }) => html`
                  <editor-icon-button
                    aria-label=${value}
                    .tooltip=${value}
                    .active=${selectedStartPointStyle === value}
                    .activeMode=${'background'}
                    .iconSize=${'20px'}
                    @click=${() =>
                      this._setConnectorPointStyle(
                        ConnectorEndpoint.Front,
                        value
                      )}
                  >
                    ${icon}
                  </editor-icon-button>
                `
              )}
            </div>
          </editor-menu-button>

          <editor-icon-button
            aria-label="Flip direction"
            .tooltip=${'Flip direction'}
            .disabled=${false}
            .iconSize=${'20px'}
            @click=${() =>
              this._flipEndpointStyle(
                selectedStartPointStyle,
                selectedEndPointStyle
              )}
          >
            ${FlipDirectionIcon()}
          </editor-icon-button>

          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="End point style"
                .tooltip=${'End point style'}
                .iconSize=${'20px'}
              >
                ${this._getEndpointIcon(
                  REAR_ENDPOINT_STYLE_LIST,
                  selectedEndPointStyle
                )}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <div>
              ${repeat(
                REAR_ENDPOINT_STYLE_LIST,
                item => item.value,
                ({ value, icon }) => html`
                  <editor-icon-button
                    aria-label=${value}
                    .tooltip=${value}
                    .active=${selectedEndPointStyle === value}
                    .activeMode=${'background'}
                    .iconSize=${'20px'}
                    @click=${() =>
                      this._setConnectorPointStyle(
                        ConnectorEndpoint.Rear,
                        value
                      )}
                  >
                    ${icon}
                  </editor-icon-button>
                `
              )}
            </div>
          </editor-menu-button>

          <editor-menu-button
            .button=${html`
              <editor-icon-button
                aria-label="Shape"
                .tooltip=${'Connector shape'}
                .iconSize=${'20px'}
              >
                ${choose(selectedMode, MODE_CHOOSE)}${SmallArrowDownIcon}
              </editor-icon-button>
            `}
          >
            <div>
              ${repeat(
                MODE_LIST,
                item => item.name,
                ({ name, value, icon }) => html`
                  <editor-icon-button
                    aria-label=${name}
                    .tooltip=${name}
                    .active=${selectedMode === value}
                    .activeMode=${'background'}
                    .iconSize=${'20px'}
                    @click=${() => this._setConnectorMode(value)}
                  >
                    ${icon}
                  </editor-icon-button>
                `
              )}
            </div>
          </editor-menu-button>
        `,

        choose<string, TemplateResult<1> | typeof nothing>(
          this._showAddButtonOrTextMenu(),
          [
            [
              'button',
              () => html`
                <editor-icon-button
                  aria-label="Add text"
                  .tooltip=${'Add text'}
                  .iconSize=${'20px'}
                  @click=${this._addLabel}
                >
                  ${AddTextIcon()}
                </editor-icon-button>
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
      renderToolbarSeparator
    );
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor elements: ConnectorElementModel[] = [];

  @query('edgeless-color-picker-button.stroke-color')
  accessor strokeColorButton!: EdgelessColorPickerButton;
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
