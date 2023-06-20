/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { BlockSpec } from '@blocksuite/block-std';
import { BlockStore, UIEventDispatcher } from '@blocksuite/block-std';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { PropertyValues, TemplateResult } from 'lit';
import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StaticValue } from 'lit/static-html.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { ShadowlessElement } from './shadowless-element.js';

export type LitBlockSpec = BlockSpec<StaticValue>;

@customElement('block-suite-root')
export class BlockSuiteRoot extends ShadowlessElement {
  @property({ attribute: false })
  blocks!: LitBlockSpec[];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  modelSubscribed = new Set<string>();

  uiEventDispatcher = new UIEventDispatcher(this);

  blockStore!: BlockStore<StaticValue>;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('blocks')) {
      this.blockStore.applySpecs(this.blocks);
      this.requestUpdate();
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this.blockStore = new BlockStore<StaticValue>({
      uiEventDispatcher: this.uiEventDispatcher,
    });
    this.uiEventDispatcher.mount();
    this.blockStore.applySpecs(this.blocks);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.blockStore.dispose();
    this.uiEventDispatcher.unmount();
  }

  override render() {
    const { root } = this.page;
    if (!root) {
      return null;
    }

    return this.renderModel(root);
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    const { flavour, children } = model;
    const schema = this.page.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      console.warn(`Cannot find schema for ${flavour}.`);
      return html`${nothing}`;
    }

    const view = this.blockStore.getView(flavour);
    if (!view) {
      console.warn(`Cannot find view for ${flavour}.`);
      return html`${nothing}`;
    }

    const tag = view.component;
    this._onLoadModel(model);

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

  _onLoadModel = (model: BaseBlockModel) => {
    const { id } = model;
    if (!this.modelSubscribed.has(id)) {
      model.propsUpdated.on(() => {
        this.requestUpdate();
      });
      model.childrenUpdated.on(() => {
        this.requestUpdate();
      });
      this.modelSubscribed.add(id);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'block-suite-root': BlockSuiteRoot;
  }
}
