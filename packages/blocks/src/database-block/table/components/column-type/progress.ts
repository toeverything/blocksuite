import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { literal } from 'lit/static-html.js';

import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

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
    background: var(--affine-hover-color);
  }

  .affine-database-progress-fg {
    height: 100%;
    background: var(--affine-success-color);
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

type DragConfig = {
  stepWidth: number;
  containerWidth: number;
  boundLeft: number;
};

@customElement('affine-database-progress-cell-editing')
class ProgressCellEditing extends DatabaseCellElement<number> {
  static override styles = styles;

  static override tag = literal`affine-database-progress-cell-editing`;

  @query('.affine-database-progress-drag-handle')
  private _dragHandle!: HTMLElement;

  @query('.affine-database-progress-bg')
  private _progressBg!: HTMLElement;

  @state()
  private _positionX = -1;

  private _translateX = 0;
  private _dragConfig: DragConfig | null = null;

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

    if (this.cell?.value) {
      const { width } = this._progressBg.getBoundingClientRect();
      const visibleWidth = width - 6;
      const x = visibleWidth * (this.cell.value / 100);
      this._translateX = x;
      this._dragHandle.style.transform = `translate(${x}, -1px)`;
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
      this._positionX = 0;
    } else if (x - boundLeft >= containerWidth) {
      steps = 100;
      this._positionX = containerWidth;
    } else {
      steps = Math.floor((x - boundLeft) / stepWidth);
      this._positionX = Math.abs(x - boundLeft);
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

    const fgStyles = styleMap({
      width: `${progress}%`,
    });

    const dragStyles = styleMap({
      transform: `translate(${
        this._positionX !== -1 ? this._positionX : this._translateX
      }px, -1px)`,
    });

    return html`<div
      class="affine-database-progress"
      @mousedown=${(e: Event) => e.preventDefault()}
    >
      <div class="affine-database-progress-bar">
        <div class="affine-database-progress-bg">
          <div class="affine-database-progress-fg" style=${fgStyles}></div>
          <div
            class="affine-database-progress-drag-handle"
            style=${dragStyles}
          ></div>
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
