/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { BlockSpec } from '@blocksuite/block-std';
import {
  BlockStore,
  SelectionManager,
  UIEventDispatcher,
} from '@blocksuite/block-std';
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

export class PathMap<Value = unknown> {
  private _map = new Map<string, Value>();

  constructor() {
    this._map = new Map();
  }

  static pathToKey = (path: string[]) => {
    return path.join('|');
  };

  static keyToPath = (key: string) => {
    return key.split('|');
  };

  get(path: string[]) {
    return this._map.get(PathMap.pathToKey(path));
  }

  set(path: string[], value: Value) {
    this._map.set(PathMap.pathToKey(path), value);
  }

  delete(path: string[]) {
    this._map.delete(PathMap.pathToKey(path));
  }

  has(path: string[]) {
    return this._map.has(PathMap.pathToKey(path));
  }

  entries() {
    return Array.from(this._map.entries()).map(value => {
      return [PathMap.keyToPath(value[0]), value[1]] as const;
    });
  }

  values() {
    return Array.from(this._map.values());
  }

  clear() {
    this._map.clear();
  }
}

@customElement('block-suite-root')
export class BlockSuiteRoot extends ShadowlessElement {
  @property({ attribute: false })
  blocks!: LitBlockSpec[];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  modelSubscribed = new Set<string>();

  uiEventDispatcher!: UIEventDispatcher;

  selectionManager!: SelectionManager;

  blockStore!: BlockStore<StaticValue>;

  blockViewMap = new PathMap<BlockElement>();

  widgetViewMap = new PathMap<WidgetElement>();

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('blocks')) {
      this.blockStore.applySpecs(this.blocks);
    }
    if (changedProperties.has('page')) {
      this.blockStore.page = this.page;
    }
    super.willUpdate(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.selectionManager = new SelectionManager(this, this.page.workspace);
    this.uiEventDispatcher = new UIEventDispatcher(
      this,
      this.selectionManager,
      this.page
    );
    this.blockStore = new BlockStore<StaticValue>({
      root: this,
      uiEventDispatcher: this.uiEventDispatcher,
      selectionManager: this.selectionManager,
      workspace: this.page.workspace,
      page: this.page,
    });

    this.selectionManager.mount(this.page);
    this.uiEventDispatcher.mount();

    this.blockStore.applySpecs(this.blocks);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.blockStore.dispose();

    this.uiEventDispatcher.unmount();
    this.selectionManager.unmount();
    this.blockViewMap.clear();
    this.widgetViewMap.clear();
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

    const view = this.blockStore.getView(flavour);
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
