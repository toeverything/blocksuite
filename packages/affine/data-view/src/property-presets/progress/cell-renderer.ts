import { css, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { startDrag } from '../../core/utils/drag.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { progressPropertyModelConfig } from './define.js';

const styles = css`
  affine-database-progress-cell-editing {
    display: block;
    width: 100%;
    padding: 0 4px;
  }

  affine-database-progress-cell {
    display: block;
    width: 100%;
    padding: 0 4px;
  }

  .affine-database-progress {
    display: flex;
    align-items: center;
    height: var(--data-view-cell-text-line-height);
    gap: 4px;
  }

  .affine-database-progress-bar {
    position: relative;
    width: 104px;
  }

  .affine-database-progress-bg {
    overflow: hidden;
    width: 100%;
    height: 10px;
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
    height: 12px;
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

export class ProgressCell extends BaseCellRenderer<number> {
  static override styles = styles;

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
        <div class="affine-database-progress-bg" style=${bgStyles}>
          <div class="affine-database-progress-fg" style=${fgStyles}></div>
        </div>
      </div>
      <div class="progress-number progress">${progress}</div>
    </div>`;
  }
}

export class ProgressCellEditing extends BaseCellRenderer<number> {
  static override styles = styles;

  startDrag = (event: MouseEvent) => {
    const bgRect = this._progressBg.getBoundingClientRect();
    const min = bgRect.left;
    const max = bgRect.right;
    const setValue = (x: number) => {
      this.tempValue = Math.round(
        ((Math.min(max, Math.max(min, x)) - min) / (max - min)) * 100
      );
    };
    startDrag(event, {
      onDrag: ({ x }) => {
        setValue(x);
        return;
      },
      onMove: ({ x }) => {
        setValue(x);
        return;
      },
      onDrop: () => {
        //
      },
      onClear: () => {
        //
      },
    });
  };

  get _value() {
    return this.tempValue ?? this.value ?? 0;
  }

  _onChange(value?: number) {
    this.tempValue = value;
  }

  override firstUpdated() {
    const disposables = this._disposables;

    disposables.addFromEvent(this._progressBg, 'pointerdown', this.startDrag);
    disposables.addFromEvent(window, 'keydown', evt => {
      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        this._onChange(Math.max(0, this._value - 1));
        return;
      }
      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        this._onChange(Math.min(100, this._value + 1));
        return;
      }
    });
  }

  override onCopy(_e: ClipboardEvent) {
    _e.preventDefault();
  }

  override onCut(_e: ClipboardEvent) {
    _e.preventDefault();
  }

  override onExitEditMode() {
    this.onChange(this._value);
  }

  override onPaste(_e: ClipboardEvent) {
    _e.preventDefault();
  }

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

    return html` <div class="affine-database-progress">
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

  @query('.affine-database-progress-bg')
  private accessor _progressBg!: HTMLElement;

  @state()
  private accessor tempValue: number | undefined = undefined;
}

export const progressPropertyConfig =
  progressPropertyModelConfig.createPropertyMeta({
    icon: createIcon('ProgressIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(ProgressCell),
      edit: createFromBaseCellRenderer(ProgressCellEditing),
    },
  });
