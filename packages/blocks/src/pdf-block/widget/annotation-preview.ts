import { WidgetElement } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { FontLinkedPageIcon } from '../../_common/icons/text.js';
import type { PDFBlockComponent } from '../pdf-block.js';

export const AFFINE_ANNOTATION_PREVIEW_WIDGET = 'affine-annotation-preview';

declare global {
  interface HTMLElementTagNameMap {
    'affine-annotation-preview': AnnotationPreview;
  }
}

@customElement('affine-annotation-preview')
export class AnnotationPreview extends WidgetElement<PDFBlockComponent> {
  static override styles = css`
    .hovered-annotation {
      position: absolute;
    }

    .hovered-icon {
      display: block;
      width: 20px;
      height: 20px;
      color: var(--affine-text-primary-color);
      background: var(--affine-background-overlay-panel-color);
    }

    .annotation-preview {
      display: none;
      position: absolute;
      top: 20px;
      max-width: 200px;
      border-radius: 8px;

      color: var(--affine-text-primary-color);
      background: var(--affine-background-overlay-panel-color);
      padding: 4px 8px;
      box-shadow: var(--affine-shadow-2);
    }

    .hovered-annotation:hover > .annotation-preview {
      display: block;
    }
  `;

  private _annotationPositions: {
    key: string;
    comment: string;
    hightRects: [number, number, number, number][];
  }[] = [];

  @state()
  private _hoveredAnnotation:
    | null
    | AnnotationPreview['_annotationPositions'][number] = null;

  private _resetAnnotationPositions(page: number) {
    const comments = this.blockElement.model.getAnnotationsByPage(page);
    const commentPositions: AnnotationPreview['_annotationPositions'] = [];

    comments.forEach(({ annotation, key }) => {
      if (annotation.get('highlightRects')?.[page]?.length) {
        commentPositions.push({
          key,
          comment: annotation.get('comment').toString(),
          hightRects: annotation.get('highlightRects')[page],
        });
      }
    });

    this._annotationPositions = commentPositions;
  }

  private _showAnnotation(annotation: AnnotationPreview['_hoveredAnnotation']) {
    this._hoveredAnnotation = annotation;
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override firstUpdated(
    _changedProperties: Map<string | number | symbol, unknown>
  ) {
    this._disposables.addFromEvent(this.blockElement, 'pagechange', () => {
      this._resetAnnotationPositions(this.blockElement.currentPage);
    });
    this._disposables.add(
      this.blockElement.model.annotationUpdated.on(() => {
        this._resetAnnotationPositions(this.blockElement.currentPage);
      })
    );
    this._disposables.addFromEvent(
      this.blockElement.pdfContainer,
      'pointermove',
      (event: PointerEvent) => {
        const position = this.blockElement.toPDFCoords(
          event.clientX,
          event.clientY
        );

        // check if the mouse is on the annotation icon
        if (this._hoveredAnnotation) {
          const firstRect = this._hoveredAnnotation.hightRects[0];

          if (
            position.x >= firstRect[0] &&
            position.x <= firstRect[0] + firstRect[2] &&
            position.y >= firstRect[1] - 22 &&
            position.y <= firstRect[1]
          ) {
            return;
          }
        }

        let showingFlag = false;

        for (const annotation of this._annotationPositions) {
          annotation.hightRects.forEach(rect => {
            if (
              position.x >= rect[0] &&
              position.x <= rect[0] + rect[2] &&
              position.y >= rect[1] - 22 &&
              position.y <= rect[1] + rect[3]
            ) {
              showingFlag = true;
              this._showAnnotation(annotation);
            }
          });
        }

        if (!showingFlag) {
          this._hoveredAnnotation = null;
        }
      }
    );
  }

  override render() {
    if (!this._hoveredAnnotation) {
      return nothing;
    }

    const firstRect = this._hoveredAnnotation.hightRects[0];

    return html`<div class="pdf-annotation-preview">
      <div
        class="hovered-annotation"
        style=${styleMap({
          left: `${firstRect[0]}px`,
          top: `${firstRect[1] - 22}px`,
        })}
      >
        <span class="hovered-icon">${FontLinkedPageIcon}</span>
        <div class="annotation-preview">${this._hoveredAnnotation.comment}</div>
      </div>
    </div>`;
  }
}
