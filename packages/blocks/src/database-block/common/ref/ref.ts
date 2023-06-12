import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { propertyMatcher } from '../../logical/property-matcher.js';
import type { Variable, VariableOrProperty, VariableRef } from '../ast.js';
import { DatabaseMenuComponent } from '../menu.js';
import { createDatabasePopup } from '../popup.js';

@customElement('variable-ref-view')
export class VariableRefView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .field-select {
      cursor: pointer;
    }

    .property-select {
      cursor: pointer;
      padding: 0 2px;
    }
  `;
  @property()
  data?: VariableOrProperty;

  @property()
  setData!: (filter: VariableOrProperty) => void;

  @property()
  vars!: Variable[];

  get field() {
    if (!this.data) {
      return;
    }
    if (this.data.type === 'ref') {
      return this.data.name;
    }
    return this.data.ref.name;
  }

  get fieldLabel() {
    const id = this.field;
    if (!id) {
      return;
    }
    return this.vars.find(v => v.id === id)?.name;
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

  @query('.field-select')
  fieldSelect!: HTMLElement;

  @query('.property-select')
  propertySelect!: HTMLElement;

  selectField() {
    popSelectField(this.fieldSelect, {
      vars: this.vars,
      onSelect: ref => this.setData(ref),
    });
  }

  selectProperty() {
    const menu = new DatabaseMenuComponent();
    const field = this.field;
    const fieldType = this.vars.find(v => v.id === field)?.type;
    if (!fieldType || !field) {
      return;
    }
    const properties = propertyMatcher.allMatchedData(fieldType);
    menu.menuGroup = properties.map(v => ({
      type: 'action',
      label: v.name,
      click: () => {
        this.setData({
          type: 'property',
          ref: { type: 'ref', name: field },
          propertyFuncName: v.name,
        });
      },
    }));
    createDatabasePopup(this.propertySelect, menu);
  }

  override render() {
    // const property = html`<span class='property-select' @click='${this.selectProperty}'
    //       >${this.property ?? '⋮'}</span>
    //       `;
    return html`
      <div style="display:flex;align-items:center;">
        <div style="display:flex;align-items:center;">
          <span class="field-select" @click="${this.selectField}"
            >${this.fieldLabel}</span
          >
        </div>
        <div style="display:flex;align-items:center;">
          ${this.property &&
          html`<span style="margin-right: 4px;">${`'s`}</span>`}
          <PlainSelect
            :value="propertyName"
            @update:value="setPropertyName"
            :options="propertyOptions"
          ></PlainSelect>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'variable-ref-view': VariableRefView;
  }
}
export const popSelectField = (
  target: HTMLElement,
  props: {
    vars: Variable[];
    onSelect: (ref: VariableRef) => void;
  }
) => {
  const menu = new DatabaseMenuComponent();
  menu.menuGroup = props.vars.map(v => ({
    type: 'action',
    label: v.name,
    click: () => {
      props.onSelect({
        type: 'ref',
        name: v.id,
      });
    },
  }));
  createDatabasePopup(target, menu);
};
