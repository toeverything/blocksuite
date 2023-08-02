import type { BlockService, BlockSuiteViewSpec } from '@blocksuite/block-std';
import type { EventName, UIEventHandler } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { PathMap } from '@blocksuite/block-std';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { WithDisposable } from '../with-disposable.js';
import type { BlockSuiteRoot } from './lit-root.js';
import { ShadowlessElement } from './shadowless-element.js';
import type { WidgetElement } from './widget-element.js';

export class BlockElement<
  Model extends BaseBlockModel = BaseBlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string
> extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  model!: Model;

  @property({ attribute: false })
  content!: TemplateResult;

  @property({ attribute: false })
  widgets!: Record<WidgetName, TemplateResult>;

  @property({ attribute: false })
  page!: Page;

  @state()
  selected: BaseSelection | null = null;

  path!: string[];

  get parentPath(): string[] {
    return this.path.slice(0, -1);
  }

  get parentBlockElement() {
    const parentElement = this.parentElement;
    assertExists(parentElement);
    const nodeView = this.root.viewStore.getNodeView(parentElement);
    assertExists(nodeView);
    return nodeView.view as BlockElement;
  }

  get flavour(): string {
    return this.model.flavour;
  }

  handleEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean; flavour?: boolean }
  ) => {
    const config = {
      flavour: options?.global
        ? undefined
        : options?.flavour
        ? this.model.flavour
        : undefined,
      path: options?.global || options?.flavour ? undefined : this.path,
    };
    this._disposables.add(
      this.root.uiEventDispatcher.add(name, handler, config)
    );
  };

  bindHotKey(
    keymap: Record<string, UIEventHandler>,
    options?: { global?: boolean; flavour?: boolean }
  ) {
    const config = {
      flavour: options?.global
        ? undefined
        : options?.flavour
        ? this.model.flavour
        : undefined,
      path: options?.global || options?.flavour ? undefined : this.path,
    };
    this._disposables.add(
      this.root.uiEventDispatcher.bindHotkey(keymap, config)
    );
  }

  get widgetElements(): Partial<Record<WidgetName, WidgetElement>> {
    return Object.keys(this.widgets).reduce((mapping, key) => {
      return {
        ...mapping,
        [key]: this.root.viewStore.getViewByPath([...this.path, key])?.view,
      };
    }, {}) as Partial<Record<WidgetName, WidgetElement>>;
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    return this.root.renderModel(model);
  };

  get service(): Service | undefined {
    return this.root.blockStore.specStore.getService(this.model.flavour) as
      | Service
      | undefined;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.root.selectionManager.slots.changed.on(selections => {
        const selection = selections.find(selection =>
          PathMap.equals(selection.path, this.path)
        );

        if (!selection) {
          this.selected = null;
          return;
        }

        if (this.selected && this.selected.equals(selection)) {
          return;
        }

        this.selected = selection;
      })
    );

    this.path = this.root.viewStore.calculatePath(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  override render(): unknown {
    return null;
  }
}

declare global {
  interface BlockSuiteView {
    block: BlockSuiteViewSpec<BlockElement>;
  }
}
