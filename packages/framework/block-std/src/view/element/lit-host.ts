/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import { handleError } from '@blocksuite/global/exceptions';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel, Doc } from '@blocksuite/store';
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

import type { CommandManager } from '../../command/index.js';
import type { UIEventDispatcher } from '../../event/index.js';
import { BlockStdScope } from '../../scope/index.js';
import type { SelectionManager } from '../../selection/index.js';
import type { BlockSpec, SpecStore } from '../../spec/index.js';
import { RangeManager } from '../utils/range-manager.js';
import { WithDisposable } from '../utils/with-disposable.js';
import type { ViewStore } from '../view-store.js';
import type { BlockElement } from './block-element.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

@customElement('editor-host')
export class EditorHost extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  specs!: BlockSpec[];

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  @property({ attribute: false })
  widgetIdAttr = 'data-widget-id';

  std!: BlockSuite.Std;

  rangeManager: RangeManager | null = null;

  get command(): CommandManager {
    return this.std.command;
  }

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
    if (changedProperties.has('specs')) {
      this.std.spec.applySpecs(this.specs);
    }
    super.willUpdate(changedProperties);
  }

  override async getUpdateComplete(): Promise<boolean> {
    try {
      const result = await super.getUpdateComplete();
      const rootModel = this.doc.root;
      assertExists(rootModel);
      const view = this.std.spec.getView(rootModel.flavour);
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
    } catch (e) {
      if (e instanceof Error) {
        handleError(e);
      } else {
        console.error(e);
      }
      return true;
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    if (!this.doc.root) {
      throw new Error(
        'This doc is missing root block. Please initialize the default block structure before connecting the editor to DOM.'
      );
    }

    this.std = new BlockStdScope({
      host: this,
      collection: this.doc.collection,
      doc: this.doc,
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
    const { root } = this.doc;
    if (!root) return nothing;

    return this._renderModel(root);
  }

  private _renderModel = (model: BlockModel): TemplateResult => {
    const { flavour } = model;
    const schema = this.doc.schema.flavourSchemaMap.get(flavour);
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
          )}=${key} .host=${this} .doc=${this.doc}></${tag}>`;

          return {
            ...mapping,
            [key]: template,
          };
        }, {})
      : {};

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .host=${this}
      .doc=${this.doc}
      .model=${model}
      .widgets=${widgets}
    ></${tag}>`;
  };

  /**
   * @deprecated
   *
   * This method is deprecated. Use `renderSpecPortal` instead.
   */
  renderModel = (model: BlockModel): TemplateResult => {
    return this._renderModel(model);
  };

  renderSpecPortal = (doc: Doc, specs: BlockSpec[]) => {
    return html`
      <editor-host
        .doc=${doc}
        .specs=${specs}
        contenteditable="false"
      ></editor-host>
    `;
  };

  renderChildren = (model: BlockModel): TemplateResult => {
    return html`${repeat(
      model.children,
      child => child.id,
      child => this._renderModel(child)
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
