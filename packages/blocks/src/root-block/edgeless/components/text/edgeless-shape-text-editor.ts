import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import type { ShapeElementModel } from '../../../../surface-block/element-model/index.js';
import { SHAPE_TEXT_PADDING } from '../../../../surface-block/elements/shape/consts.js';
import { Bound, toRadian, Vec } from '../../../../surface-block/index.js';
import { wrapFontFamily } from '../../../../surface-block/utils/font.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-shape-text-editor')
export class EdgelessShapeTextEditor extends WithDisposable(ShadowlessElement) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  element!: ShapeElementModel;

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
  private _resizeObserver: ResizeObserver | null = null;

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  private _updateHeight() {
    const bcr = this.richText.getBoundingClientRect();
    const containerHeight = this.richText.offsetHeight;

    if (containerHeight > this.element.h) {
      const [leftTopX, leftTopY] = Vec.rotWith(
        [this.richText.offsetLeft, this.richText.offsetTop],
        [bcr.left + bcr.width / 2, bcr.top + bcr.height / 2],
        toRadian(-this.element.rotate)
      );

      const [modelLeftTopX, modelLeftTopY] =
        this.edgeless.service.viewport.toModelCoord(leftTopX, leftTopY);

      this.edgeless.service.updateElement(this.element.id, {
        xywh: new Bound(
          modelLeftTopX,
          modelLeftTopY,
          this.element.w,
          containerHeight
        ).serialize(),
      });
      this.richText.style.minHeight = `${containerHeight}px`;
    }
    this.edgeless.service.selection.set({
      elements: [this.element.id],
      editing: true,
    });
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);

    this.element.textDisplay = false;

    this.disposables.add(
      this.edgeless.service.viewport.viewportUpdated.on(() => {
        this.requestUpdate();
        this.updateComplete
          .then(() => {
            this._updateHeight();
          })
          .catch(console.error);
      })
    );
    this.disposables.add(
      dispatcher.add('click', () => {
        return true;
      })
    );
    this.disposables.add(
      dispatcher.add('doubleClick', () => {
        return true;
      })
    );

    this.updateComplete
      .then(() => {
        this.inlineEditor.focusEnd();

        this.disposables.add(
          this.inlineEditor.slots.renderComplete.on(() => {
            this._updateHeight();
          })
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          () => {
            if (this._keeping) return;
            this._unmount();
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

  private _unmount() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.element.textDisplay = true;

    this.remove();
    this.edgeless.service.selection.set({
      elements: [],
      editing: false,
    });
  }

  override render() {
    if (!this.element.text) {
      throw new Error('Failed to mount shape editor because of no text.');
    }

    const viewport = this.edgeless.service.viewport;
    const zoom = viewport.zoom;
    const rect = getSelectedRect([this.element]);
    const rotate = this.element.rotate;
    const [leftTopX, leftTopY] = Vec.rotWith(
      [rect.left, rect.top],
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      toRadian(rotate)
    );
    const [x, y] = this.edgeless.service.viewport.toViewCoord(
      leftTopX,
      leftTopY
    );

    const inlineEditorStyle = styleMap({
      position: 'absolute',
      left: x + 'px',
      top: y + 'px',
      width: rect.width + 'px',
      minHeight: rect.height + 'px',
      // override rich-text style (height: 100%)
      height: 'initial',
      fontSize: this.element.fontSize + 'px',
      fontFamily: wrapFontFamily(this.element.fontFamily),
      lineHeight: 'initial',
      outline: 'none',
      transform: `scale(${zoom}, ${zoom}) rotate(${rotate}deg)`,
      transformOrigin: 'top left',
      color: isCssVariable(this.element.color)
        ? `var(${this.element.color})`
        : this.element.color,
      padding: SHAPE_TEXT_PADDING + 'px',
      textAlign: this.element.textAlign,
      display: 'grid',
      gridTemplateColumns: '100%',
      alignItems:
        this.element.textVerticalAlign === 'center'
          ? 'center'
          : this.element.textVerticalAlign === 'bottom'
            ? 'end'
            : 'start',
      alignContent: 'center',
      gap: '0',
      zIndex: '1',
    });

    return html`<rich-text
      .yText=${this.element.text}
      .enableFormat=${false}
      .enableAutoScrollHorizontally=${false}
      .enableAutoScrollVertically=${false}
      style=${inlineEditorStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-text-editor': EdgelessShapeTextEditor;
  }
}
