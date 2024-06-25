import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { popFilterableSimpleMenu } from '../../../../_common/components/index.js';
import { AddCursorIcon } from '../../../../_common/icons/index.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import type { Filter, Variable, VariableOrProperty } from '../ast.js';
import { firstFilterByRef, firstFilterInGroup } from '../ast.js';

@customElement('variable-ref-view')
export class VariableRefView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    variable-ref-view {
      font-size: 12px;
      line-height: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 4px;
      border-radius: 4px;
      cursor: pointer;
    }

    variable-ref-view:hover {
      background-color: var(--affine-hover-color);
    }

    variable-ref-view svg {
      width: 16px;
      height: 16px;
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
    }
  `;

  @property({ attribute: false })
  accessor data: VariableOrProperty | undefined = undefined;

  @property({ attribute: false })
  accessor setData!: (filter: VariableOrProperty) => void;

  @property({ attribute: false })
  accessor vars!: Variable[];

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.addFromEvent(this, 'click', e => {
      popFilterableSimpleMenu(
        e.target as HTMLElement,
        this.vars.map(v => ({
          type: 'action',
          name: v.name,
          icon: renderUniLit(v.icon, {}),
          select: () => {
            this.setData({
              type: 'ref',
              name: v.id,
            });
          },
        }))
      );
    });
  }

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

  override render() {
    const data = this.fieldData;
    return html` ${renderUniLit(data?.icon, {})} ${data?.name} `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'variable-ref-view': VariableRefView;
  }
}
export const popCreateFilter = (
  target: HTMLElement,
  props: {
    vars: Variable[];
    onSelect: (filter: Filter) => void;
    onClose?: () => void;
  }
) => {
  popFilterableSimpleMenu(
    target,
    [
      ...props.vars.map(v => ({
        type: 'action' as const,
        name: v.name,
        icon: renderUniLit(v.icon, {}),
        select: () => {
          props.onSelect(
            firstFilterByRef(props.vars, {
              type: 'ref',
              name: v.id,
            })
          );
        },
      })),
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Add filter group',
            icon: AddCursorIcon,
            select: () => {
              props.onSelect(firstFilterInGroup(props.vars));
            },
          },
        ],
      },
    ],
    props.onClose
  );
};
