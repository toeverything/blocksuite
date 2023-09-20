/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type {
  BlockSpec,
  SelectionManager,
  UIEventDispatcher,
  ViewStore,
} from '@blocksuite/block-std';
import { BlockStdProvider } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { StaticValue } from 'lit/static-html.js';
import { html, unsafeStatic } from 'lit/static-html.js';

import { RangeManager } from '../utils/range-manager.js';
import { WithDisposable } from '../with-disposable.js';
import type { BlockElement } from './block-element.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

export type LitBlockSpec<WidgetNames extends string = string> = BlockSpec<
  StaticValue,
  WidgetNames
>;

@customElement('block-suite-root')
export class BlockSuiteRoot extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  blocks!: LitBlockSpec[];

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  blockIdAttr = 'data-block-id';

  @property({ attribute: false })
  widgetIdAttr = 'data-widget-id';

  modelSubscribed = new Set<string>();

  std!: BlockSuite.Std;

  rangeManager: RangeManager | null = null;

  get event(): UIEventDispatcher {
    return this.std.event;
  }

  get selection(): SelectionManager {
    return this.std.selection;
  }

  get view(): ViewStore<BlockElement | WidgetElement> {
    return this.std.view;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('blocks')) {
      this.std.spec.applySpecs(this.blocks);
    }
    super.willUpdate(changedProperties);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.std = new BlockStdProvider<StaticValue, BlockElement | WidgetElement>({
      root: this,
      workspace: this.page.workspace,
      page: this.page,
    });
    this._registerView();

    this.std.mount();
    this.std.spec.applySpecs(this.blocks);
    this.rangeManager = new RangeManager(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.std.unmount();
    this.modelSubscribed.clear();
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
    const { flavour, children } = model;
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
          )}=${key} .root=${this} .page=${this.page}></${tag}>`;

          return {
            ...mapping,
            [key]: template,
          };
        }, {})
      : {};

    const content = children.length
      ? html`${repeat(
          children,
          child => child.id,
          child => this.renderModel(child)
        )}`
      : null;

    this._onLoadModel(model);

    return html`<${tag}
      ${unsafeStatic(this.blockIdAttr)}=${model.id}
      .root=${this}
      .page=${this.page}
      .model=${model}
      .widgets=${widgets}
      .content=${content}
    ></${tag}>`;
  };

  private _onLoadModel = (model: BaseBlockModel) => {
    const { id } = model;
    if (!this.modelSubscribed.has(id)) {
      this._disposables.add(
        model.propsUpdated.on(() => {
          this.requestUpdate();
        })
      );
      this._disposables.add(
        model.childrenUpdated.on(() => {
          this.requestUpdate();
        })
      );
      this.modelSubscribed.add(id);
    }
  };

  private _registerView = () => {
    const blockSelector = `[${this.blockIdAttr}]`;
    const widgetSelector = `[${this.widgetIdAttr}]`;

    this.std.view.register<'block'>({
      type: 'block',
      fromDOM: node => {
        return fromDOM<BlockElement>(
          node,
          this.blockIdAttr,
          this.widgetIdAttr,
          'block'
        );
      },
      toDOM: ({ view }) => view,
      getChildren: view =>
        getChildren(view, blockSelector, widgetSelector, 'block'),
    });

    this.std.view.register<'widget'>({
      type: 'widget',
      fromDOM: node => {
        return fromDOM<WidgetElement>(
          node,
          this.widgetIdAttr,
          this.blockIdAttr,
          'widget'
        );
      },
      toDOM: ({ view }) => view,
      getChildren: view =>
        getChildren(view, blockSelector, widgetSelector, 'widget'),
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
  view: Element,
  blockSelector: string,
  widgetSelector: string,
  type: BlockSuite.ViewType
) {
  const selector = `${blockSelector},${widgetSelector}`;
  return Array.from(
    view.querySelectorAll<BlockElement | WidgetElement>(selector)
  ).filter(
    x =>
      x.parentElement?.closest(
        type === 'block' ? blockSelector : widgetSelector
      ) === view
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'block-suite-root': BlockSuiteRoot;
  }

  namespace BlockSuite {
    interface ComponentType {
      lit: StaticValue;
    }

    interface NodeView {
      block: BlockElement;
      widget: WidgetElement;
    }
  }
}
