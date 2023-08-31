import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { tTag } from '../../../logical/data-type.js';
import type { TArray, TypeOfData } from '../../../logical/typesystem.js';
import { LiteralElement } from './literal-element.js';

@customElement('data-view-literal-tag-view')
export class TagLiteral extends LiteralElement<
  string,
  TypeOfData<typeof tTag>
> {
  static override styles = css`
    data-view-literal-tag-view {
      max-width: 100px;
      display: block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  `;
  tags() {
    const tags = this.type.data?.tags;
    if (!tags) {
      return [];
    }
    return tags;
  }

  override render() {
    if (!this.value) {
      return html`<span class="dv-color-2">Empty</span>`;
    }
    return (
      this.tags().find(v => v.id === this.value)?.value ??
      html`<span class="dv-color-2">Empty</span>`
    );
  }
}

@customElement('data-view-literal-multi-tag-view')
export class MultiTagLiteral extends LiteralElement<
  string[],
  TArray<TypeOfData<typeof tTag>>
> {
  static override styles = css`
    data-view-literal-multi-tag-view {
      max-width: 100px;
      display: block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  `;

  tags() {
    const type = this.type.ele;
    if (!tTag.is(type)) {
      return [];
    }
    const tags = type.data?.tags;
    if (!tags) {
      return [];
    }
    return tags;
  }

  override render() {
    if (!this.value?.length) {
      return html`<span class="dv-color-2">Empty</span>`;
    }
    const tagMap = new Map(this.tags().map(v => [v.id, v.value]));
    return html`${this.value.map(id => tagMap.get(id)).join(',')}`;
  }
}
