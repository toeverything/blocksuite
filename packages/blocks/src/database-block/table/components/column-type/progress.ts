import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { literal } from 'lit/static-html.js';

import {
  DatabaseCellElement,
  defineColumnRenderer,
  type TableViewCell,
} from '../../register.js';

const styles = css`
  affine-database-progress-cell-editing {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0 4px;
  }

  affine-database-progress-cell-editing:hover
    .affine-database-progress-drag-handle {
    opacity: 1;
  }

  .affine-database-progress {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 4px;
  }

  .affine-database-progress-bar {
    position: relative;
    width: 104px;
  }

  .affine-database-progress-bg {
    overflow: hidden;
    width: 100%;
    height: 13px;
    border-radius: 22px;
  }

  .affine-database-progress-fg {
    height: 100%;
  }

  .affine-database-progress-drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(0px, -1px);
    width: 6px;
    height: 15px;
    border-radius: 2px;
    opacity: 0;
    cursor: ew-resize;
    background: var(--affine-primary-color);
    transition: opacity 0.2s ease-in-out;
  }

  .progress-number {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 18px;
    width: 25px;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
  }
`;

const progressColors = {
  empty: 'var(--affine-black-10)',
  processing: 'var(--affine-processing-color)',
  success: 'var(--affine-success-color)',
};

type DragConfig = {
  stepWidth: number;
  containerWidth: number;
  boundLeft: number;
};

@customElement('affine-database-progress-cell-editing')
class ProgressCellEditing
  extends DatabaseCellElement<number>
  implements TableViewCell
{
  static override styles = styles;

  static override tag = literal`affine-database-progress-cell-editing`;
  cellType = 'progress' as const;

  @query('.affine-database-progress-drag-handle')
  private _dragHandle!: HTMLElement;

  @query('.affine-database-progress-bg')
  private _progressBg!: HTMLElement;

  private _dragConfig: DragConfig | null = null;
  private _progressBgWidth = 0;

  override firstUpdated() {
    const disposables = this._disposables;

    disposables.addFromEvent(
      this._dragHandle,
      'pointerdown',
      this._onPointerDown
    );
    disposables.addFromEvent(this, 'pointermove', this._onPointerMove);
    disposables.addFromEvent(this, 'pointerup', this._onPointerUp);
    disposables.addFromEvent(document, 'pointermove', this._onDocumentMove);

    const { width } = this._progressBg.getBoundingClientRect();
    const visibleWidth = width - 6;
    this._progressBgWidth = visibleWidth;
    const value = this.cell?.value;
    if (value) {
      this._setDragHandlePosition(value);
    }
  }

  private _setDragHandlePosition(value: number) {
    const x = this._progressBgWidth * (value / 100);
    this._dragHandle.style.transform = `translate(${x}px, -1px)`;
  }

  protected override updated(_changedProperties: Map<string, unknown>) {
    super.updated(_changedProperties);

    if (_changedProperties.has('cell')) {
      this._setDragHandlePosition(this.cell?.value ?? 0);
    }
  }

  private _onDocumentMove = () => {
    if (!this._dragConfig) return;
    this._onPointerUp();
  };

  private _onPointerDown = (event: PointerEvent) => {
    event.stopPropagation();
    const { left, width } = this._progressBg.getBoundingClientRect();
    const visibleWidth = width - 6;
    this._dragConfig = {
      stepWidth: visibleWidth / 100,
      boundLeft: left,
      containerWidth: visibleWidth,
    };
    this.databaseModel.page.captureSync();
  };

  private _onPointerMove = (event: PointerEvent) => {
    event.stopPropagation();
    if (!this._dragConfig) return;
    const x = event.clientX;
    const { boundLeft, containerWidth, stepWidth } = this._dragConfig;

    let steps: number;
    if (x <= boundLeft) {
      steps = 0;
    } else if (x - boundLeft >= containerWidth) {
      steps = 100;
    } else {
      steps = Math.floor((x - boundLeft) / stepWidth);
    }

    if (this.cell?.value !== steps) {
      this.rowHost.setValue(steps, { captureSync: false });
    }
  };

  private _onPointerUp = () => {
    this._dragConfig = null;
    this.databaseModel.page.captureSync();
  };

  protected override render() {
    const progress = this.cell?.value ?? 0;
    let backgroundColor = progressColors.processing;
    if (progress === 100) {
      backgroundColor = progressColors.success;
    }
    const fgStyles = styleMap({
      width: `${progress}%`,
      backgroundColor,
    });
    const bgStyles = styleMap({
      backgroundColor:
        progress === 0 ? progressColors.empty : 'var(--affine-hover-color)',
    });

    return html`<div
      class="affine-database-progress"
      @mousedown=${(e: Event) => e.preventDefault()}
    >
      <div class="affine-database-progress-bar">
        <div class="affine-database-progress-bg" style=${bgStyles}>
          <div class="affine-database-progress-fg" style=${fgStyles}></div>
          <div class="affine-database-progress-drag-handle"></div>
        </div>
      </div>
      <div class="progress-number progress">${progress}</div>
    </div>`;
  }
}

export const ProgressColumnRenderer = defineColumnRenderer(
  'progress',
  () => ({}),
  () => 0,
  {
    Cell: ProgressCellEditing,
    CellEditing: null,
  },
  {
    displayName: 'Progress',
  }
);
