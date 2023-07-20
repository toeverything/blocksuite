import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { DatabaseCellElement } from '../../register.js';

const styles = css`
  affine-database-progress-cell-editing {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0 4px;
  }

  affine-database-progress-cell {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0 4px;
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
    opacity: 1;
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

@customElement('affine-database-progress-cell')
export class ProgressCell extends DatabaseCellElement<number> {
  static override styles = styles;

  _bgClick(e: MouseEvent) {
    this.onChange(
      Math.round(
        (e.offsetX * 100) / (e.currentTarget as HTMLDivElement).offsetWidth
      )
    );
  }

  protected override render() {
    const progress = this.value ?? 0;
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

    return html` <div class="affine-database-progress">
      <div class="affine-database-progress-bar">
        <div
          class="affine-database-progress-bg"
          @click="${this._bgClick}"
          style=${bgStyles}
        >
          <div class="affine-database-progress-fg" style=${fgStyles}></div>
        </div>
      </div>
      <div class="progress-number progress">${progress}</div>
    </div>`;
  }
}

@customElement('affine-database-progress-cell-editing')
export class ProgressCellEditing extends DatabaseCellElement<number> {
  static override styles = styles;

  @state()
  private tempValue?: number;

  override onExitEditMode() {
    this.onChange(this._value);
  }

  get _value() {
    return this.tempValue ?? this.value ?? 0;
  }

  _onChange(value?: number) {
    this.tempValue = value;
  }

  @query('.affine-database-progress-bg')
  private _progressBg!: HTMLElement;

  private _dragConfig: DragConfig | null = null;

  override firstUpdated() {
    const disposables = this._disposables;

    disposables.addFromEvent(
      this._progressBg,
      'pointerdown',
      this._onPointerDown
    );
    disposables.addFromEvent(document, 'pointermove', this._onPointerMove);
    disposables.addFromEvent(document, 'pointerup', this._onPointerUp);
    disposables.addFromEvent(window, 'keydown', evt => {
      if (evt.key === 'ArrowDown') {
        this._onChange(Math.max(0, this._value - 1));
        return;
      }
      if (evt.key === 'ArrowUp') {
        this._onChange(Math.min(100, this._value + 1));
        return;
      }
    });
  }

  private _onPointerDown = (event: PointerEvent) => {
    event.stopPropagation();
    const { left, width } = this._progressBg.getBoundingClientRect();
    const visibleWidth = width - 6;
    this._dragConfig = {
      stepWidth: visibleWidth / 100,
      boundLeft: left,
      containerWidth: visibleWidth,
    };
    this._onPointerMove(event);
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

    if (this._value !== steps) {
      this._onChange(steps);
    }
  };

  private _onPointerUp = () => {
    this._dragConfig = null;
  };

  protected override render() {
    const progress = this._value;
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
    const handleStyles = styleMap({
      left: `calc(${progress}% - 3px)`,
    });

    return html` <div
      class="affine-database-progress"
      @mousedown="${(e: Event) => e.preventDefault()}"
    >
      <div class="affine-database-progress-bar">
        <div class="affine-database-progress-bg" style=${bgStyles}>
          <div class="affine-database-progress-fg" style=${fgStyles}></div>
          <div
            class="affine-database-progress-drag-handle"
            style=${handleStyles}
          ></div>
        </div>
      </div>
      <div class="progress-number progress">${progress}</div>
    </div>`;
  }
}
