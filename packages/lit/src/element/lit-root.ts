/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type {
  BlockSpec,
  SelectionManager,
  UIEventDispatcher,
  ViewStore,
} from '@blocksuite/block-std';
import { BlockStore } from '@blocksuite/block-std';
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

  blockStore!: BlockStore<StaticValue, BlockElement | WidgetElement>;

  rangeManager: RangeManager | null = null;

  get uiEventDispatcher(): UIEventDispatcher {
    return this.blockStore.uiEventDispatcher;
  }

  get selectionManager(): SelectionManager {
    return this.blockStore.selectionManager;
  }

  get viewStore(): ViewStore<BlockElement | WidgetElement> {
    return this.blockStore.viewStore;
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

    this.blockStore = new BlockStore<StaticValue, BlockElement | WidgetElement>(
      {
        root: this,
        workspace: this.page.workspace,
        page: this.page,
      }
    );
    this._registerView();

    this.blockStore.mount();
    this.blockStore.specStore.applySpecs(this.blocks);
    this.rangeManager = new RangeManager(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.blockStore.unmount();
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

    const view = this.blockStore.specStore.getView(flavour);
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

    const fromDOM = <T extends Element & { path: string[] }>(
      node: Node,
      target: string,
      notInside: string
    ) => {
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
      };
    };

    this.blockStore.viewStore.register('block', {
      fromDOM: node => {
        return fromDOM<BlockElement>(node, this.blockIdAttr, this.widgetIdAttr);
      },
      toDOM: ({ view }) => {
        return view;
      },
      getChildren: view => {
        return Array.from(
          view.querySelectorAll<BlockElement>(
            `${blockSelector},${widgetSelector}`
          )
        ).filter(x => {
          return x.parentElement?.closest(blockSelector) === view;
        });
      },
    });

    this.blockStore.viewStore.register('widget', {
      fromDOM: node => {
        return fromDOM<WidgetElement>(
          node,
          this.widgetIdAttr,
          this.blockIdAttr
        );
      },
      toDOM: ({ view }) => {
        return view;
      },
      getChildren: () => {
        return [];
      },
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'block-suite-root': BlockSuiteRoot;
  }
}
