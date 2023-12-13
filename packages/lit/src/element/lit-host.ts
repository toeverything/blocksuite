/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type {
  BlockSpec,
  SelectionManager,
  SpecStore,
  UIEventDispatcher,
  ViewStore,
} from '@blocksuite/block-std';
import { BlockStdScope } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import {
  LitElement,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StaticValue } from 'lit/static-html.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { RangeManager } from '../utils/range-manager.js';
import { WithDisposable } from '../with-disposable.js';
import type { BlockElement } from './block-element.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

@customElement('editor-host')
export class EditorHost extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  specs!: BlockSpec[];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  @property({ attribute: false })
  widgetIdAttr = 'data-widget-id';

  std!: BlockSuite.Std;

  rangeManager: RangeManager | null = null;

  get event(): UIEventDispatcher {
    return this.std.event;
  }

  get selection(): SelectionManager {
    return this.std.selection;
  }

  get view(): ViewStore {
    return this.std.view;
  }

  get spec(): SpecStore {
    return this.std.spec;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('preset')) {
      this.std.spec.applySpecs(this.specs);
    }
    super.willUpdate(changedProperties);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    const root = this.page.root;
    assertExists(root);
    const view = this.std.spec.getView(root.flavour);
    assertExists(view);
    const widgetTags = Object.values(view.widgets ?? {});
    const elementsTags = [view.component, ...widgetTags];
    await Promise.all(
      elementsTags.map(tag => {
        const element = this.renderRoot.querySelector(tag._$litStatic$);
        if (element instanceof LitElement) {
          return element.updateComplete;
        }
        return;
      })
    );
    return result;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.std = new BlockStdScope({
      host: this,
      workspace: this.page.workspace,
      page: this.page,
    });
    this._registerView();

    this.std.mount();
    this.std.spec.applySpecs(this.specs);
    this.rangeManager = new RangeManager(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.std.unmount();
    this.rangeManager = null;
  }

  override render() {
    const { root } = this.page;
    if (!root) {
      return null;
    }

    return this.renderModel(root);
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    const { flavour } = model;
    const schema = this.page.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      console.warn(`Cannot find schema for ${flavour}.`);
      return html`${nothing}`;
    }

    const view = this.std.spec.getView(flavour);
    if (!view) {
      console.warn(`Cannot find view for ${flavour}.`);
      return html`${nothing}`;
    }

    const tag = view.component;
    const widgets: Record<string, TemplateResult> = view.widgets
      ? Object.entries(view.widgets).reduce((mapping, [key, tag]) => {
          const template = html`<${tag} ${unsafeStatic(
            this.widgetIdAttr
          )}=${key} .host=${this} .page=${this.page}></${tag}>`;

          return {
            ...mapping,
            [key]: template,
          };
        }, {})
      : {};

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .host=${this}
      .page=${this.page}
      .model=${model}
      .widgets=${widgets}
    ></${tag}>`;
  };

  renderModelChildren = (model: BaseBlockModel): TemplateResult => {
    return html`${repeat(
      model.children,
      child => child.id,
      child => this.renderModel(child)
    )}`;
  };

  private _registerView = () => {
    const blockSelector = `[${this.blockIdAttr}]`;
    const widgetSelector = `[${this.widgetIdAttr}]`;

    this.std.view.register<'block'>({
      type: 'block',
      fromDOM: node =>
        fromDOM<BlockElement>(
          node,
          this.blockIdAttr,
          this.widgetIdAttr,
          'block'
        ),
      toDOM: ({ view }) => view,
      getChildren: node =>
        getChildren(node, blockSelector, widgetSelector, 'block'),
    });

    this.std.view.register<'widget'>({
      type: 'widget',
      fromDOM: node =>
        fromDOM<WidgetElement>(
          node,
          this.widgetIdAttr,
          this.blockIdAttr,
          'widget'
        ),
      toDOM: ({ view }) => view,
      getChildren: node =>
        getChildren(node, blockSelector, widgetSelector, 'widget'),
    });
  };
}

function fromDOM<T extends Element & { path: string[] }>(
  node: Node,
  target: string,
  notInside: string,
  type: BlockSuite.ViewType
) {
  const selector = `[${target}]`;
  const notInSelector = `[${notInside}]`;
  const element =
    node && node instanceof HTMLElement ? node : node.parentElement;
  if (!element) return null;

  const view = element.closest<T>(selector);
  if (!view) {
    return null;
  }
  const not = element.closest(notInSelector);
  if (view.contains(not)) {
    return null;
  }

  const id = view.getAttribute(target);
  assertExists(id);

  return {
    id,
    path: view.path,
    view,
    type,
  };
}

function getChildren(
  node: Element,
  blockSelector: string,
  widgetSelector: string,
  type: BlockSuite.ViewType
) {
  const selector = `${blockSelector},${widgetSelector}`;
  return Array.from(
    node.querySelectorAll<BlockElement | WidgetElement>(selector)
  ).filter(
    x =>
      x.parentElement?.closest(
        type === 'block' ? blockSelector : widgetSelector
      ) === node
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'editor-host': EditorHost;
  }

  namespace BlockSuite {
    interface ComponentType {
      lit: StaticValue;
    }

    interface NodeViewType {
      block: BlockElement;
      widget: WidgetElement;
    }
  }
}
