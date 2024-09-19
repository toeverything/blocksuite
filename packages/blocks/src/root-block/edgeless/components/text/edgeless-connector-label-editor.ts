import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { ConnectorElementModel } from '@blocksuite/affine-model';

import { TextUtils } from '@blocksuite/affine-block-surface';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { almostEqual } from '@blocksuite/affine-shared/utils';
import {
  RANGE_SYNC_EXCLUDE_ATTR,
  ShadowlessElement,
} from '@blocksuite/block-std';
import {
  assertExists,
  Bound,
  Vec,
  WithDisposable,
} from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

const HORIZONTAL_PADDING = 2;
const VERTICAL_PADDING = 2;
const BORDER_WIDTH = 1;

export class EdgelessConnectorLabelEditor extends WithDisposable(
  ShadowlessElement
) {
  static override styles = css`
    .edgeless-connector-label-editor {
      position: absolute;
      left: 0;
      top: 0;
      transform-origin: center;
      z-index: 10;
      padding: ${VERTICAL_PADDING}px ${HORIZONTAL_PADDING}px;
      border: ${BORDER_WIDTH}px solid var(--affine-primary-color, #1e96eb);
      background: var(--affine-background-primary-color, #fff);
      border-radius: 2px;
      box-shadow: 0px 0px 0px 2px rgba(30, 150, 235, 0.3);
      box-sizing: border-box;
      overflow: visible;

      .inline-editor {
        white-space: pre-wrap !important;
        outline: none;
      }

      .inline-editor span {
        word-break: normal !important;
        overflow-wrap: anywhere !important;
      }

      .edgeless-connector-label-editor-placeholder {
        pointer-events: none;
        color: var(--affine-text-disable-color);
        white-space: nowrap;
      }
    }
  `;

  private _isComposition = false;

  private _keeping = false;

  private _resizeObserver: ResizeObserver | null = null;

  private _updateLabelRect = () => {
    const { connector, edgeless } = this;
    if (!connector || !edgeless) return;

    const newWidth = this.inlineEditorContainer.scrollWidth;
    const newHeight = this.inlineEditorContainer.scrollHeight;
    const center = connector.getPointByOffsetDistance(
      connector.labelOffset.distance
    );
    const bounds = Bound.fromCenter(center, newWidth, newHeight);
    const labelXYWH = bounds.toXYWH();

    if (
      !connector.labelXYWH ||
      labelXYWH.some((p, i) => !almostEqual(p, connector.labelXYWH![i]))
    ) {
      edgeless.service.updateElement(connector.id, {
        labelXYWH,
      });
    }
  };

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  override firstUpdated() {
    const { edgeless, connector } = this;
    const { dispatcher } = edgeless;
    assertExists(dispatcher);

    this._resizeObserver = new ResizeObserver(() => {
      this._updateLabelRect();
      this.requestUpdate();
    });
    this._resizeObserver.observe(this.richText);

    this.updateComplete
      .then(() => {
        this.inlineEditor.selectAll();

        this.inlineEditor.slots.renderComplete.on(() => {
          this.requestUpdate();
        });

        this.disposables.add(
          dispatcher.add('keyDown', ctx => {
            const state = ctx.get('keyboardState');
            const { key, ctrlKey, metaKey, altKey, shiftKey, isComposing } =
              state.raw;
            const onlyCmd = (ctrlKey || metaKey) && !altKey && !shiftKey;
            const isModEnter = onlyCmd && key === 'Enter';
            const isEscape = key === 'Escape';
            if (!isComposing && (isModEnter || isEscape)) {
              this.inlineEditorContainer.blur();

              edgeless.service.selection.set({
                elements: [connector.id],
                editing: false,
              });
              return true;
            }
            return false;
          })
        );

        this.disposables.add(
          edgeless.service.surface.elementUpdated.on(({ id }) => {
            if (id === connector.id) this.requestUpdate();
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
          if (connector.text) {
            const text = connector.text.toString();
            const trimed = text.trim();
            const len = trimed.length;
            if (len === 0) {
              // reset
              edgeless.service.updateElement(connector.id, {
                text: undefined,
                labelXYWH: undefined,
                labelOffset: undefined,
              });
            } else if (len < text.length) {
              edgeless.service.updateElement(connector.id, {
                // @TODO: trim in Y.Text?
                text: new DocCollection.Y.Text(trimed),
              });
            }
          }

          connector.lableEditing = false;

          edgeless.service.selection.set({
            elements: [],
            editing: false,
          });
        });

        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => {
            if (this._keeping) return;
            this.remove();
          }
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

        connector.lableEditing = true;
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const { connector } = this;
    const {
      labelOffset: { distance },
      labelStyle: {
        fontFamily,
        fontSize,
        fontStyle,
        fontWeight,
        textAlign,
        color: labelColor,
      },
      labelConstraints: { hasMaxWidth, maxWidth },
    } = connector;

    const lineHeight = TextUtils.getLineHeight(
      fontFamily,
      fontSize,
      fontWeight
    );
    const { translateX, translateY, zoom } = this.edgeless.service.viewport;
    const [x, y] = Vec.mul(connector.getPointByOffsetDistance(distance), zoom);
    const transformOperation = [
      'translate(-50%, -50%)',
      `translate(${translateX}px, ${translateY}px)`,
      `translate(${x}px, ${y}px)`,
      `scale(${zoom})`,
    ];

    const isEmpty = !connector.text?.length && !this._isComposition;
    const color = ThemeObserver.generateColorProperty(labelColor, '#000000');

    return html`
      <div
        class="edgeless-connector-label-editor"
        style=${styleMap({
          fontFamily: `"${fontFamily}"`,
          fontSize: `${fontSize}px`,
          fontStyle,
          fontWeight,
          textAlign,
          lineHeight: `${lineHeight}px`,
          maxWidth: hasMaxWidth
            ? `${maxWidth + BORDER_WIDTH * 2 + HORIZONTAL_PADDING * 2}px`
            : 'initial',
          color,
          transform: transformOperation.join(' '),
        })}
      >
        <rich-text
          .yText=${connector.text}
          .enableFormat=${false}
          style=${isEmpty
            ? styleMap({
                position: 'absolute',
                left: 0,
                top: 0,
                padding: `${VERTICAL_PADDING}px ${HORIZONTAL_PADDING}px`,
              })
            : nothing}
        ></rich-text>
        ${isEmpty
          ? html`
              <span class="edgeless-connector-label-editor-placeholder">
                Add text
              </span>
            `
          : nothing}
      </div>
    `;
  }

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  @property({ attribute: false })
  accessor connector!: ConnectorElementModel;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @query('rich-text')
  accessor richText!: RichText;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-connector-label-editor': EdgelessConnectorLabelEditor;
  }
}
