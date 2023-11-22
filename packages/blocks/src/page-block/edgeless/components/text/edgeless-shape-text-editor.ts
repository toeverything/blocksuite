import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { SHAPE_TEXT_PADDING } from '../../../../surface-block/elements/shape/consts.js';
import { wrapFontFamily } from '../../../../surface-block/elements/text/utils.js';
import type {
  PhasorElementType,
  ShapeElement,
} from '../../../../surface-block/index.js';
import { Bound, toRadian, Vec } from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-shape-text-editor')
export class EdgelessShapeTextEditor extends WithDisposable(ShadowlessElement) {
  @query('rich-text')
  richText!: RichText;

  @property({ attribute: false })
  element!: ShapeElement;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  get vEditor() {
    assertExists(this.richText.vEditor);
    return this.richText.vEditor;
  }
  get vEditorContainer() {
    return this.vEditor.rootElement;
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

      const [modelLeftTopX, modelLeftTopY] = this.edgeless.surface.toModelCoord(
        leftTopX,
        leftTopY
      );

      this.edgeless.surface.updateElement<PhasorElementType.SHAPE>(
        this.element.id,
        {
          xywh: new Bound(
            modelLeftTopX,
            modelLeftTopY,
            this.element.w,
            containerHeight
          ).serialize(),
        }
      );
      this.richText.style.minHeight = `${containerHeight}px`;
    }
    this.edgeless.selectionManager.setSelection({
      elements: [this.element.id],
      editing: true,
    });
  }

  override firstUpdated(): void {
    const dispatcher = this.edgeless.dispatcher;
    assertExists(dispatcher);

    this.edgeless.localRecord.update(this.element.id, {
      textDisplay: false,
    });

    this.disposables.add(
      this.edgeless.slots.viewportUpdated.on(() => {
        this.requestUpdate();
        this.updateComplete.then(() => {
          this._updateHeight();
        });
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

    this.updateComplete.then(() => {
      this.vEditor.focusEnd();

      this.disposables.add(
        this.vEditor.slots.updated.on(() => {
          this._updateHeight();
        })
      );
      this.disposables.addFromEvent(this.vEditorContainer, 'blur', () => {
        if (this._keeping) return;
        this._unmount();
      });
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  private _unmount() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    this.edgeless.localRecord.update(this.element.id, {
      textDisplay: true,
    });

    this.remove();
    this.edgeless.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
  }

  override render() {
    if (!this.element.text) {
      throw new Error('Failed to mount shape editor because of no text.');
    }

    const viewport = this.edgeless.surface.viewport;
    const zoom = viewport.zoom;
    const rect = getSelectedRect([this.element]);
    const rotate = this.element.rotate;
    const [leftTopX, leftTopY] = Vec.rotWith(
      [rect.left, rect.top],
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      toRadian(rotate)
    );
    const [x, y] = this.edgeless.surface.toViewCoord(leftTopX, leftTopY);

    const virgoStyle = styleMap({
      position: 'absolute',
      left: x + 'px',
      top: y + 'px',
      width: rect.width + 'px',
      minHeight: rect.height + 'px',
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
      style=${virgoStyle}
    ></rich-text>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-text-editor': EdgelessShapeTextEditor;
  }
}
