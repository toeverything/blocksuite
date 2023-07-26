/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type {
  BlockSpec,
  SelectionManager,
  UIEventDispatcher,
  ViewStore,
} from '@blocksuite/block-std';
import { BlockStore } from '@blocksuite/block-std';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { PropertyValues, TemplateResult } from 'lit';
import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StaticValue } from 'lit/static-html.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import type { BlockElement } from './block-element.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

export type LitBlockSpec<WidgetNames extends string = string> = BlockSpec<
  StaticValue,
  WidgetNames
>;

@customElement('block-suite-root')
export class BlockSuiteRoot extends ShadowlessElement {
  @property({ attribute: false })
  blocks!: LitBlockSpec[];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  modelSubscribed = new Set<string>();

  blockStore!: BlockStore<StaticValue, BlockElement, WidgetElement>;

  get uiEventDispatcher(): UIEventDispatcher {
    return this.blockStore.uiEventDispatcher;
  }

  get selectionManager(): SelectionManager {
    return this.blockStore.selectionManager;
  }

  get viewStore(): ViewStore<BlockElement, WidgetElement> {
    return this.blockStore.viewStore;
  }

  get blockViewMap() {
    return this.viewStore.blockViewMap;
  }

  get widgetViewMap() {
    return this.viewStore.widgetViewMap;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('blocks')) {
      this.blockStore.specStore.applySpecs(this.blocks);
    }
    if (changedProperties.has('page')) {
      this.blockStore.page = this.page;
    }
    super.willUpdate(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.blockStore = new BlockStore<StaticValue, BlockElement, WidgetElement>({
      root: this,
      workspace: this.page.workspace,
      page: this.page,
      config: {
        getBlockViewByNode: node => {
          const element =
            node && node instanceof HTMLElement ? node : node.parentElement;
          if (!element) return null;

          return element.closest(`[${this.blockIdAttr}]`);
        },
      },
    });

    this.blockStore.mount();
    this.blockStore.specStore.applySpecs(this.blocks);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.blockStore.unmount();
  }

  override render() {
    const { root } = this.page;
    if (!root) {
      return null;
    }

    return this.renderModel(root, []);
  }

  renderModel = (model: BaseBlockModel, path: string[]): TemplateResult => {
    const { flavour, children } = model;
    const schema = this.page.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      console.warn(`Cannot find schema for ${flavour}.`);
      return html`${nothing}`;
    }

    const view = this.blockStore.specStore.getView(flavour);
    if (!view) {
      console.warn(`Cannot find view for ${flavour}.`);
      return html`${nothing}`;
    }

    const currentPath = path.concat(model.id);

    const tag = view.component;
    const widgets: Record<string, TemplateResult> = view.widgets
      ? Object.entries(view.widgets).reduce((mapping, [key, tag]) => {
          const path = currentPath.concat(key);

          return {
            ...mapping,
            [key]: html`<${tag} .path=${path} .root=${this} .page=${this.page}></${tag}>`,
          };
        }, {})
      : {};

    this._onLoadModel(model);

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .root=${this}
      .page=${this.page}
      .model=${model}
      .widgets=${widgets}
      .path=${currentPath}
      .content=${html`${repeat(
        children,
        child => child.id,
        child => this.renderModel(child, currentPath)
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
