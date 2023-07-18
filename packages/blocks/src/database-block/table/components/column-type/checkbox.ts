import { css, html } from 'lit';
import { query } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';

import {
  checkboxChecked,
  checkboxUnchecked,
} from '../../../../list-block/utils/icons.js';
import { DatabaseCellElement, defineColumnRenderer } from '../../register.js';

class CheckboxCell extends DatabaseCellElement<boolean> {
  static override tag = literal`affine-database-checkbox-cell`;

  static override styles = css`
    affine-database-checkbox-cell {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .affine-database-checkbox-container {
      height: 100%;
    }

    .affine-database-checkbox {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;
      position: relative;
    }
    .affine-database-checkbox-animation {
      width: 20px;
      height: 20px;
      position: absolute;
      left: 0px;
      border-radius: 50%;
    }
    .animation {
      animation: sparking 0.6s ease forwards;
    }
    @keyframes sparking {
      0% {
        width: 14px;
        height: 14px;
        left: 3px;
      }
      40% {
        width: 20px;
        height: 20px;
        left: 0px;
        box-shadow: 0 -18px 0 -8px #1e96eb, 16px -8px 0 -8px #1e96eb,
          16px 8px 0 -8px #1e96eb, 0 18px 0 -8px #1e96eb,
          -16px 8px 0 -8px #1e96eb, -16px -8px 0 -8px #1e96eb;
      }

      100% {
        width: 20px;
        height: 20px;
        left: 0px;
        box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent,
          32px 16px 0 -10px transparent, 0 36px 0 -10px transparent,
          -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
      }
    }
  `;

  @query('.affine-database-checkbox-animation')
  private _animation!: HTMLDivElement;

  protected override firstUpdated() {
    this._animation.addEventListener('animationend', () => {
      this._animation.classList.remove('animation');
    });
  }

  override beforeEnterEditMode() {
    const checked = !this.value;

    if (checked) {
      this._animation.classList.add('animation');
    }

    this.onChange(checked);
    return false;
  }

  override render() {
    const checked = this.value ?? false;

    const icon = checked ? checkboxChecked() : checkboxUnchecked();
    return html` <div class="affine-database-checkbox-container">
      <div class="affine-database-checkbox checkbox ${checked && 'checked'}">
        <div class="affine-database-checkbox-animation"></div>
        ${icon}
      </div>
    </div>`;
  }
}

export const CheckboxColumnRenderer = defineColumnRenderer(
  'checkbox',
  {
    Cell: CheckboxCell,
    CellEditing: null,
  },
  {
    displayName: 'Checkbox',
  }
);
