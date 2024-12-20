import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { Variable, VariableOrProperty } from '../ast.js';

import { renderUniLit } from '../../utils/uni-component/uni-component.js';

export class VariableRefView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    microsheet-variable-ref-view {
      font-size: 12px;
      line-height: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 4px;
      border-radius: 4px;
      cursor: pointer;
    }

    microsheet-variable-ref-view:hover {
      background-color: var(--affine-hover-color);
    }

    microsheet-variable-ref-view svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
    }
  `;

  get field() {
    if (!this.data) {
      return;
    }
    if (this.data.type === 'ref') {
      return this.data.name;
    }
    return this.data.ref.name;
  }

  get fieldData() {
    const id = this.field;
    if (!id) {
      return;
    }
    return this.vars.find(v => v.id === id);
  }

  get property() {
    if (!this.data) {
      return;
    }
    if (this.data.type === 'ref') {
      return;
    }
    return this.data.propertyFuncName;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', e => {
      popFilterableSimpleMenu(
        popupTargetFromElement(e.target as HTMLElement),
        this.vars.map(v =>
          menu.action({
            name: v.name,
            prefix: renderUniLit(v.icon, {}),
            select: () => {
              this.setData({
                type: 'ref',
                name: v.id,
              });
            },
          })
        )
      );
    });
  }

  override render() {
    const data = this.fieldData;
    return html` ${renderUniLit(data?.icon, {})} ${data?.name} `;
  }

  @property({ attribute: false })
  accessor data: VariableOrProperty | undefined = undefined;

  @property({ attribute: false })
  accessor setData!: (filter: VariableOrProperty) => void;

  @property({ attribute: false })
  accessor vars!: Variable[];
}

declare global {
  interface HTMLElementTagNameMap {
    'microsheet-variable-ref-view': VariableRefView;
  }
}
