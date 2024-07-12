import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { RichText } from '../../../../_common/components/rich-text/rich-text.js';
import type { EdgelessRootBlockComponent } from '../../edgeless-root-block.js';

import {
  getNearestTranslation,
  isElementOutsideViewport,
} from '../../../../_common/edgeless/mindmap/index.js';
import { isCssVariable } from '../../../../_common/theme/css-variables.js';
import { TextResizing } from '../../../../surface-block/consts.js';
import {
  MindmapElementModel,
  type ShapeElementModel,
} from '../../../../surface-block/element-model/index.js';
import { Bound, Vec, toRadian } from '../../../../surface-block/index.js';
import { wrapFontFamily } from '../../../../surface-block/utils/font.js';
import { getSelectedRect } from '../../utils/query.js';

@customElement('edgeless-shape-text-editor')
export class EdgelessShapeTextEditor extends WithDisposable(ShadowlessElement) {
  private _keeping = false;

  private _lastXYWH = '';

  private _resizeObserver: ResizeObserver | null = null;

  private _initMindmapKeyBindings() {
    if (!this.element.surface.isInMindmap(this.element.id)) {
      return;
    }

    const service = this.edgeless.service;

    this._disposables.addFromEvent(this, 'keydown', evt => {
      switch (evt.key) {
        case 'Enter': {
          evt.preventDefault();
          const edgeless = this.edgeless;
          const element = this.element;
          const mindmap = this.element.group as MindmapElementModel;
          const parent = mindmap.getParentNode(element.id) ?? element;
          const id = mindmap.addNode(parent.id);

          requestAnimationFrame(() => {
            this.element = edgeless.service.getElementById(
              id
            ) as ShapeElementModel;
            const element = this.element;
            this.mountEditor?.(element, edgeless);

            if (isElementOutsideViewport(service.viewport, element, [90, 20])) {
              const [dx, dy] = getNearestTranslation(
                edgeless.service.viewport,
                element,
                [100, 20]
              );

              edgeless.service.viewport.smoothTranslate(
                service.viewport.centerX - dx,
                service.viewport.centerY + dy
              );
            }
          });

          (this.ownerDocument.activeElement as HTMLElement).blur();
          break;
        }
        case 'Tab': {
          evt.preventDefault();
          const edgeless = this.edgeless;
          const element = this.element;
          const mindmap = this.element.group as MindmapElementModel;
          const id = mindmap.addNode(element.id);

          requestAnimationFrame(() => {
            this.element = edgeless.service.getElementById(
              id
            ) as ShapeElementModel;
            const element = this.element;
            this.mountEditor?.(element, edgeless);

            if (isElementOutsideViewport(service.viewport, element, [90, 20])) {
              const [dx, dy] = getNearestTranslation(
                edgeless.service.viewport,
                element,
                [100, 20]
              );

              edgeless.service.viewport.smoothTranslate(
                service.viewport.centerX - dx,
                service.viewport.centerY + dy
              );
            }
          });

          (this.ownerDocument.activeElement as HTMLElement).blur();
          break;
        }
      }
    });
  }

  private _unmount() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    if (this.element.text) {
      const text = this.element.text.toString();
      const trimed = text.trim();
      const len = trimed.length;
      if (len === 0) {
        this.element.text = undefined;
      } else if (len < text.length) {
        this.element.text = new DocCollection.Y.Text(trimed);
      }
    }

    this.element.textDisplay = true;
    this.element.group instanceof MindmapElementModel &&
      this.element.group.layout();

    this.remove();
    this.edgeless.service.selection.set({
      editing: false,
      elements: [],
    });
  }

  private _updateElementWH() {
    const bcr = this.richText.getBoundingClientRect();
    const containerHeight = this.richText.offsetHeight;
    const containerWidth = this.richText.offsetWidth;
    const textResizing = this.element.textResizing;

    if (this._lastXYWH !== this.element.xywh) {
      this.requestUpdate();
    }

    if (
      (containerHeight !== this.element.h &&
        textResizing === TextResizing.AUTO_HEIGHT) ||
      (textResizing === TextResizing.AUTO_WIDTH &&
        containerWidth !== this.element.w)
    ) {
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
          textResizing === TextResizing.AUTO_WIDTH
            ? containerWidth
            : this.element.w,
          containerHeight
        ).serialize(),
      });
      this.element.group instanceof MindmapElementModel &&
        this.element.group.layout();
      this.richText.style.minHeight = `${containerHeight}px`;
    }

    this.edgeless.service.selection.set({
      editing: true,
      elements: [this.element.id],
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RangeManager.rangeSyncExcludeAttr, 'true');
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
            this._updateElementWH();
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
        if (this.element.group instanceof MindmapElementModel) {
          this.inlineEditor.selectAll();
        } else {
          this.inlineEditor.focusEnd();
        }

        this.disposables.add(
          this.inlineEditor.slots.renderComplete.on(() => {
            this._updateElementWH();
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

    this.disposables.addFromEvent(this, 'keydown', evt => {
      if (evt.key === 'Escape') {
        requestAnimationFrame(() => {
          this.edgeless.service.selection.set({
            editing: false,
            elements: [this.element.id],
          });
        });

        (this.ownerDocument.activeElement as HTMLElement).blur();
      }
    });

    this._initMindmapKeyBindings();
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    if (!this.element.text) {
      throw new Error('Failed to mount shape editor because of no text.');
    }

    const [verticalPadding, horiPadding] = this.element.padding;
    const textResizing = this.element.textResizing;
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
    const autoWidth = textResizing === TextResizing.AUTO_WIDTH;

    const inlineEditorStyle = styleMap({
      alignContent: 'center',
      alignItems:
        this.element.textVerticalAlign === 'center'
          ? 'center'
          : this.element.textVerticalAlign === 'bottom'
            ? 'end'
            : 'start',
      boxSizing: 'border-box',
      color: isCssVariable(this.element.color)
        ? `var(${this.element.color})`
        : this.element.color,
      display: 'grid',
      fontFamily: wrapFontFamily(this.element.fontFamily),
      fontSize: this.element.fontSize + 'px',
      fontWeight: this.element.fontWeight,
      gap: '0',
      gridTemplateColumns: '100%',
      // override rich-text style (height: 100%)
      height: 'initial',
      left: x + 'px',
      lineHeight: 'normal',
      maxWidth:
        textResizing === TextResizing.AUTO_WIDTH
          ? this.element.maxWidth
            ? `${this.element.maxWidth}px`
            : undefined
          : undefined,
      minHeight:
        textResizing === TextResizing.AUTO_WIDTH ? '1em' : `${rect.height}px`,
      outline: 'none',
      padding: `${verticalPadding}px ${horiPadding}px`,
      position: 'absolute',
      textAlign: this.element.textAlign,
      top: y + 'px',
      transform: `scale(${zoom}, ${zoom}) rotate(${rotate}deg)`,
      transformOrigin: 'top left',
      width:
        textResizing > TextResizing.AUTO_WIDTH
          ? rect.width + 'px'
          : 'fit-content',
      zIndex: '1',
    });

    this._lastXYWH = this.element.xywh;

    return html` <style>
        edgeless-shape-text-editor v-text [data-v-text] {
          overflow-wrap: ${autoWidth ? 'normal' : 'anywhere'};
          word-break: ${autoWidth ? 'normal' : 'break-word'} !important;
          white-space: ${autoWidth ? 'pre' : 'pre-wrap'} !important;
        }

        edgeless-shape-text-editor .inline-editor {
          min-width: 1px;
        }
      </style>
      <rich-text
        .yText=${this.element.text}
        .enableFormat=${false}
        .enableAutoScrollHorizontally=${false}
        style=${inlineEditorStyle}
      ></rich-text>`;
  }

  setKeeping(keeping: boolean) {
    this._keeping = keeping;
  }

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ attribute: false })
  accessor element!: ShapeElementModel;

  @property({ attribute: false })
  accessor mountEditor:
    | ((
        element: ShapeElementModel,
        edgeless: EdgelessRootBlockComponent
      ) => void)
    | undefined = undefined;

  @query('rich-text')
  accessor richText!: RichText;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-shape-text-editor': EdgelessShapeTextEditor;
  }
}
