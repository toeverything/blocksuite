import '../../../../_common/components/rich-text/rich-text.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { getLineHeight } from '../../../../surface-block/canvas-renderer/element-renderer/text/utils.js';
import {
  Bound,
  type ConnectorElementModel,
  type ConnectorLabelElementModel,
  Vec,
} from '../../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
// import { deleteElements } from '../../utils/crud.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-connector-label-editor')
export class EdgelessConnectorLabelEditor extends WithDisposable(
  ShadowlessElement
) {
  static PLACEHOLDER_TEXT = 'Add text';
  static HORIZONTAL_PADDING = 2;
  static VERTICAL_PADDING = 2;
  static BORDER_WIDTH = 1;
  static MAX_WIDTH = 280;

  static override styles = css`
    .edgeless-connector-text-editor {
      box-sizing: border-box;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10;
      transform-origin: center;
      border: ${EdgelessConnectorLabelEditor.BORDER_WIDTH}px solid
        var(--affine-primary-color, #1e96eb);
      border-radius: 4px;
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      padding: ${EdgelessConnectorLabelEditor.VERTICAL_PADDING}px
        ${EdgelessConnectorLabelEditor.HORIZONTAL_PADDING}px;
      overflow: visible;
    }

    .edgeless-connector-text-editor .inline-editor {
      white-space: pre-wrap !important;
      outline: none;
    }

    .edgeless-connector-text-editor .inline-editor span {
      word-break: normal !important;
      overflow-wrap: anywhere !important;
    }

    .edgeless-connector-text-editor-placeholder {
      pointer-events: none;
      color: var(--affine-text-disable-color);
      white-space: nowrap;
    }
  `;

  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  connector!: ConnectorElementModel;

  @property({ attribute: false })
  label!: ConnectorLabelElementModel;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  private _keeping = false;
  private _isComposition = false;

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  getCoordsOnRightAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime =
      (rect.w / 2) * Math.cos(rect.r) - (-rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (rect.w / 2) * Math.sin(rect.r) + (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = (w1 / 2) * Math.cos(rect.r) - (-h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (w1 / 2) * Math.sin(rect.r) + (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnCenterAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;

    let deltaXPrime = 0;
    let deltaYPrime = (-rect.h / 2) * Math.cos(rect.r);

    const vX = centerX + deltaXPrime;
    const vY = centerY + deltaYPrime;

    deltaXPrime = 0;
    deltaYPrime = (-h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  getCoordsOnLeftAlign(
    rect: { w: number; h: number; r: number; x: number; y: number },
    w1: number,
    h1: number
  ): { x: number; y: number } {
    const cX = rect.x + rect.w / 2;
    const cY = rect.y + rect.h / 2;

    let deltaXPrime =
      (-rect.w / 2) * Math.cos(rect.r) + (rect.h / 2) * Math.sin(rect.r);
    let deltaYPrime =
      (-rect.w / 2) * Math.sin(rect.r) - (rect.h / 2) * Math.cos(rect.r);

    const vX = cX + deltaXPrime;
    const vY = cY + deltaYPrime;

    deltaXPrime = (-w1 / 2) * Math.cos(rect.r) + (h1 / 2) * Math.sin(rect.r);
    deltaYPrime = (-w1 / 2) * Math.sin(rect.r) - (h1 / 2) * Math.cos(rect.r);

    const newCenterX = vX - deltaXPrime;
    const newCenterY = vY - deltaYPrime;

    return { x: newCenterX - w1 / 2, y: newCenterY - h1 / 2 };
  }

  private _updateLabelRect = () => {
    const { connector, edgeless, label } = this;
    if (!connector || !edgeless || !label) return;

    const newWidth = this.inlineEditorContainer.scrollWidth;
    const newHeight = this.inlineEditorContainer.scrollHeight;
    const point = EdgelessConnectorLabelEditor.getPosition(connector, label.t);
    const bound = new Bound(
      point[0] - newWidth / 2,
      point[1] - newHeight / 2,
      newWidth,
      newHeight
    );
    edgeless.service.updateElement(label.id, {
      xywh: bound.serialize(),
    });
  };

  static getPosition(connector: ConnectorElementModel, t = 0.5) {
    return connector.getPointByTime({
      t,
    });
  }

  getContainerOffset() {
    const { VERTICAL_PADDING, HORIZONTAL_PADDING, BORDER_WIDTH } =
      EdgelessConnectorLabelEditor;
    return `-${HORIZONTAL_PADDING + BORDER_WIDTH}px, -${
      VERTICAL_PADDING + BORDER_WIDTH
    }px`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.edgeless) {
      throw new Error('edgeless is not set.');
    }
    if (!this.connector) {
      throw new Error('connector element is not set.');
    }
    if (!this.label) {
      throw new Error('label element is not set.');
    }
  }

  override firstUpdated(): void {
    const { edgeless, label } = this;
    const { dispatcher } = edgeless;
    assertExists(dispatcher);

    this.updateComplete
      .then(() => {
        this.inlineEditor.slots.renderComplete.on(() => {
          this._updateLabelRect();
          this.requestUpdate();
        });

        this.disposables.add(
          edgeless.service.surface.elementUpdated.on(({ id }) => {
            if (id === label.id) this.requestUpdate();
          })
        );

        this.disposables.add(
          edgeless.service.viewport.viewportUpdated.on(() => {
            this.requestUpdate();
          })
        );

        this.disposables.add(dispatcher.add('click', () => true));
        this.disposables.add(dispatcher.add('doubleClick', () => true));

        this.disposables.add(() => {
          label.display = true;

          edgeless.service.selection.set({
            elements: [],
            editing: false,
          });
        });

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => !this._keeping && this.remove()
        );

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionstart',
          () => {
            this._isComposition = true;
            this.requestUpdate();
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionend',
          () => {
            this._isComposition = false;
            this.requestUpdate();
          }
        );
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const { connector, label } = this;
    const { fontFamily, fontSize, fontWeight, color, textAlign, rotate, w, t } =
      label;

    const lineHeight = getLineHeight(fontFamily, fontSize);
    const rect = getSelectedRect([label]);

    const { translateX, translateY, zoom } = this.edgeless.service.viewport;
    const [x, y] = Vec.mul(
      EdgelessConnectorLabelEditor.getPosition(connector, t),
      zoom
    );
    // const containerOffset = this.getContainerOffset();
    const transformOperation = [
      'translate(-50%, -50%)',
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${x}px, ${y}px)`,
      `scale(${zoom})`,
      `rotate(${rotate}deg)`,
      // `translate(${containerOffset})`,
    ];

    const isEmpty = !label.text.length && !this._isComposition;

    const maxWidth = Math.max(w, EdgelessConnectorLabelEditor.MAX_WIDTH);

    return html`<div
      style=${styleMap({
        transform: transformOperation.join(' '),
        minWidth: `${rect.width}px`,
        maxWidth: `${maxWidth}px`,
        fontFamily: `"${fontFamily}"`,
        fontSize: `${fontSize}px`,
        fontWeight,
        textAlign,
        lineHeight: `${lineHeight}px`,
        color: isCssVariable(color) ? `var(${color})` : color,
      })}
      class="edgeless-connector-text-editor"
    >
      <rich-text
        .yText=${label.text}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        .enableAutoScrollVertically=${false}
        style=${isEmpty
          ? styleMap({
              position: 'absolute',
              left: 0,
              top: 0,
              padding: `${EdgelessConnectorLabelEditor.VERTICAL_PADDING}px
        ${EdgelessConnectorLabelEditor.HORIZONTAL_PADDING}px`,
            })
          : nothing}
      ></rich-text>
      ${isEmpty
        ? html`<span class="edgeless-connector-text-editor-placeholder">
            Add text
          </span>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-label-editor': EdgelessConnectorLabelEditor;
  }
}
