/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { BaseBlockModel, BlockSchemaType, Page } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StaticValue } from 'lit/static-html.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { ShadowlessElement } from './shadowless-element.js';

@customElement('block-suite-root')
export class BlockSuiteRoot extends ShadowlessElement {
  @property()
  componentMap!: Map<BlockSchemaType, StaticValue>;

  @property()
  page!: Page;

  @property()
  blockIdAttr = 'data-block-id';

  modelSubscribed = new Set<string>();

  override render() {
    const { root } = this.page;
    if (!root) {
      return null;
    }

    return this.renderModel(root);
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    const { flavour, id, children } = model;
    const schema = this.page.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      console.warn(`Cannot find schema for ${flavour}.`);
      return html`${nothing}`;
    }

    const tag = this.componentMap.get(schema);
    if (!tag) {
      console.warn(`Cannot find tag for ${flavour}.`);
      return html`${nothing}`;
    }

    if (!this.modelSubscribed.has(id)) {
      model.propsUpdated.on(() => {
        this.requestUpdate();
      });
      model.childrenUpdated.on(() => {
        this.requestUpdate();
      });
      this.modelSubscribed.add(id);
    }

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .root=${this}
      .page=${this.page}
      .model=${model}
      .content=${html`${repeat(
        children,
        child => child.id,
        child => this.renderModel(child)
      )}`}
    ></${tag}>`;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'block-suite-root': BlockSuiteRoot;
  }
}
