import { CheckBoxCkeckSolidIcon, CheckBoxUnIcon } from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { query } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { checkboxPropertyModelConfig } from './define.js';

const playCheckAnimation = async (
  refElement: Element,
  { left = 0, size = 20 }: { left?: number; size?: number } = {}
) => {
  const sparkingEl = document.createElement('div');
  sparkingEl.classList.add('affine-check-animation');
  if (size < 20) {
    console.warn('If the size is less than 20, the animation may be abnormal.');
  }
  sparkingEl.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
  `;
  sparkingEl.style.left = `${left}px`;
  refElement.append(sparkingEl);

  await sparkingEl.animate(
    [
      {
        boxShadow:
          '0 -18px 0 -8px #1e96eb, 16px -8px 0 -8px #1e96eb, 16px 8px 0 -8px #1e96eb, 0 18px 0 -8px #1e96eb, -16px 8px 0 -8px #1e96eb, -16px -8px 0 -8px #1e96eb',
      },
    ],
    { duration: 240, easing: 'ease', fill: 'forwards' }
  ).finished;
  await sparkingEl.animate(
    [
      {
        boxShadow:
          '0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent',
      },
    ],
    { duration: 360, easing: 'ease', fill: 'forwards' }
  ).finished;

  sparkingEl.remove();
};

export class CheckboxCell extends BaseCellRenderer<boolean> {
  static override styles = css`
    affine-database-checkbox-cell {
      display: block;
      width: 100%;
      cursor: pointer;
    }

    .affine-database-checkbox-container {
      height: 100%;
    }

    .affine-database-checkbox {
      display: flex;
      align-items: center;
      height: var(--data-view-cell-text-line-height);
      width: 100%;
      position: relative;
    }
    .affine-database-checkbox svg {
      width: 16px;
      height: 16px;
    }
  `;

  override beforeEnterEditMode() {
    const checked = !this.value;

    this.onChange(checked);
    if (checked) {
      playCheckAnimation(this._checkbox, { left: -2 }).catch(console.error);
    }
    return false;
  }

  override onCopy(_e: ClipboardEvent) {
    _e.preventDefault();
  }

  override onCut(_e: ClipboardEvent) {
    _e.preventDefault();
  }

  override onPaste(_e: ClipboardEvent) {
    _e.preventDefault();
  }

  override render() {
    const checked = this.value ?? false;
    const icon = checked
      ? CheckBoxCkeckSolidIcon({ style: `color:#1E96EB` })
      : CheckBoxUnIcon();
    return html` <div class="affine-database-checkbox-container">
      <div
        class="affine-database-checkbox checkbox ${checked ? 'checked' : ''}"
      >
        ${icon}
      </div>
    </div>`;
  }

  @query('.affine-database-checkbox')
  private accessor _checkbox!: HTMLDivElement;
}

export const checkboxPropertyConfig =
  checkboxPropertyModelConfig.createPropertyMeta({
    icon: createIcon('CheckBoxCheckLinearIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(CheckboxCell),
    },
  });
