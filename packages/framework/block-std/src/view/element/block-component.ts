import type { Doc } from '@blocksuite/store';

import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { type BlockModel, BlockViewType } from '@blocksuite/store';
import { consume, createContext, provide } from '@lit/context';
import { SignalWatcher, computed } from '@lit-labs/preact-signals';
import { type PropertyValues, type TemplateResult, nothing, render } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { when } from 'lit/directives/when.js';
import { html } from 'lit/static-html.js';

import type { EventName, UIEventHandler } from '../../event/index.js';
import type { BlockStdScope } from '../../scope/index.js';
import type { BlockService } from '../../service/index.js';
import type { WidgetComponent } from './widget-component.js';

import { WithDisposable } from '../utils/with-disposable.js';
import { docContext, stdContext } from './lit-host.js';
import { ShadowlessElement } from './shadowless-element.js';

export const modelContext = createContext<BlockModel>('model');
export const serviceContext = createContext<BlockService>('service');

export class BlockComponent<
  Model extends BlockModel = BlockModel,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends SignalWatcher(WithDisposable(ShadowlessElement)) {
  private _selected = computed(() => {
    const selection = this.std.selection.value.find(selection => {
      return selection.blockId === this.model?.id;
    });

    if (!selection) {
      return null;
    }

    return selection;
  });

  handleEvent = (
    name: EventName,
    handler: UIEventHandler,
    options?: { global?: boolean; flavour?: boolean }
  ) => {
    const config = {
      flavour: options?.global
        ? undefined
        : options?.flavour
          ? this.model?.flavour
          : undefined,
      path: options?.global || options?.flavour ? undefined : this.path,
    };
    this._disposables.add(this.host.event.add(name, handler, config));
  };

  path!: string[];

  renderChildren = (model: BlockModel): TemplateResult => {
    return this.host.renderChildren(model);
  };

  private _renderMismatchBlock(content: unknown) {
    return when(
      this.isVersionMismatch,
      () => {
        const schema = this.doc.schema.flavourSchemaMap.get(this.model.flavour);
        if (!schema) {
          throw new BlockSuiteError(
            ErrorCode.ValueNotExists,
            `Cannot find schema for flavour ${this.model.flavour}`
          );
        }
        const expectedVersion = schema.version;
        const actualVersion = this.model.version;
        return this.renderVersionMismatch(expectedVersion, actualVersion);
      },
      () => content
    );
  }

  private _renderViewType(content: unknown) {
    return choose(this.viewType, [
      [BlockViewType.Display, () => content],
      [BlockViewType.Hidden, () => nothing],
      [BlockViewType.Bypass, () => this.renderChildren(this.model)],
    ]);
  }

  addRenderer(renderer: (content: unknown) => unknown) {
    this._renderers.push(renderer);
  }

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
    const dispose = this.host.event.bindHotkey(keymap, config);
    this._disposables.add(dispose);
    return dispose;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.std.view.setBlock(this);

    const disposable = this.std.doc.slots.blockUpdated.on(({ type, id }) => {
      if (id === this.model.id && type === 'delete') {
        this.std.view.deleteBlock(this);
        disposable.dispose();
      }
    });
    this._disposables.add(disposable);

    this.path = this.host.view.calculatePath(this.model);

    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this.service.specSlots.viewConnected.emit({
      service: this.service,
      component: this,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.service?.specSlots.viewDisconnected.emit({
      service: this.service,
      component: this,
    });
  }

  protected override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await Promise.all(this.childBlocks.map(el => el.updateComplete));
    return result;
  }

  override render() {
    return this._renderers.reduce(
      (acc, cur) => cur.call(this, acc),
      nothing as unknown
    );
  }

  renderBlock(): unknown {
    return nothing;
  }

  renderVersionMismatch(
    expectedVersion: number,
    actualVersion: number
  ): TemplateResult {
    return html`
      <dl class="version-mismatch-warning" contenteditable="false">
        <dt>
          <h4>Block Version Mismatched</h4>
        </dt>
        <dd>
          <p>
            We can not render this <var>${this.model.flavour}</var> block
            because the version is mismatched.
          </p>
          <p>Editor version: <var>${expectedVersion}</var></p>
          <p>Data version: <var>${actualVersion}</var></p>
        </dd>
      </dl>
    `;
  }

  protected override update(changedProperties: PropertyValues): void {
    // In some cases, the DOM structure is directly modified, causing Lit to lose synchronization with the DOM structure.
    // We can restore this state through the `dirty` property.
    if (this.dirty) {
      // Here we made some hacks by referring to the source code of Lit.
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/lit-element/src/lit-element.ts#L162-L163
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/reactive-element/src/reactive-element.ts#L1586-L1589
      // https://github.com/lit/lit/blob/273ad4e23b8ec97f1a5015dbf398104f535f9c34/packages/reactive-element/src/reactive-element.ts#L1509-L1512
      //@ts-ignore
      this.__reflectingProperties &&= this.__reflectingProperties.forEach(p =>
        //@ts-ignore
        this.__propertyToAttribute(p, this[p as keyof this])
      ) as undefined;
      //@ts-ignore
      this._$changedProperties = new Map();
      this.isUpdatePending = false;
      //@ts-ignore
      this.__childPart = render(nothing, this.renderRoot);

      this.updateComplete
        .then(() => {
          this.dirty = false;
        })
        .catch(console.error);
    } else {
      super.update(changedProperties);
    }
  }

  get blockId() {
    return this.dataset.blockId as string;
  }

  get childBlocks() {
    const childModels = this.model.children;
    return childModels
      .map(child => {
        return this.std.view.getBlock(child.id);
      })
      .filter((x): x is BlockComponent => !!x);
  }

  get flavour(): string {
    return this.model.flavour;
  }

  get host() {
    return this.std.host;
  }

  get isVersionMismatch() {
    const schema = this.doc.schema.flavourSchemaMap.get(this.model.flavour);
    if (!schema) {
      throw new BlockSuiteError(
        ErrorCode.ValueNotExists,
        `Cannot find schema for flavour ${this.model.flavour}`
      );
    }
    const expectedVersion = schema.version;
    const actualVersion = this.model.version;
    if (expectedVersion !== actualVersion) {
      console.warn(
        `Version mismatch for block ${this.model.id}, expected ${expectedVersion}, actual ${actualVersion}`
      );
      return true;
    }

    return false;
  }

  get model() {
    if (this._model) {
      return this._model;
    }
    const model = this.doc.getBlockById<Model>(this.blockId);
    if (!model) {
      throw new BlockSuiteError(
        ErrorCode.MissingViewModelError,
        `Cannot find block model for id ${this.blockId}`
      );
    }
    this._model = model;
    return model;
  }

  get parentBlock(): BlockComponent {
    const el = this.parentElement;
    // TODO(mirone/#6534): find a better way to get block element from a node
    return el?.closest('[data-block-id]') as BlockComponent;
  }

  get rootComponent(): BlockComponent | null {
    const rootId = this.doc.root?.id;
    if (!rootId) {
      return null;
    }
    const rootComponent = this.host.view.getBlock(rootId);
    return rootComponent ?? null;
  }

  get selected() {
    return this._selected.value;
  }

  get selection() {
    return this.host.selection;
  }

  get service(): Service {
    if (this._service) {
      return this._service;
    }
    const service = this.std.spec.getService(this.model.flavour) as Service;
    if (!service) {
      throw new BlockSuiteError(
        ErrorCode.MissingViewModelError,
        `Cannot find service for flavour ${this.model.flavour}`
      );
    }
    this._service = service;
    return service;
  }

  get topContenteditableElement(): BlockComponent | null {
    return this.rootComponent;
  }

  get widgetComponents(): Partial<Record<WidgetName, WidgetComponent>> {
    return Object.keys(this.widgets).reduce(
      (mapping, key) => ({
        ...mapping,
        [key]: this.host.view.getWidget(key, this.blockId),
      }),
      {}
    );
  }

  @provide({ context: modelContext as never })
  @state()
  private accessor _model: Model | null = null;

  @state()
  protected accessor _renderers: Array<(content: unknown) => unknown> = [
    this.renderBlock,
    this._renderMismatchBlock,
    this._renderViewType,
  ];

  @provide({ context: serviceContext as never })
  @state()
  private accessor _service: Service | null = null;

  @property({ attribute: false })
  accessor dirty = false;

  @consume({ context: docContext })
  accessor doc!: Doc;

  @consume({ context: stdContext })
  accessor std!: BlockStdScope;

  @property({ attribute: false })
  accessor viewType: BlockViewType = BlockViewType.Display;

  @property({
    attribute: false,
    hasChanged(value, oldValue) {
      if (!value || !oldValue) {
        return value !== oldValue;
      }
      // Is empty object
      if (!Object.keys(value).length && !Object.keys(oldValue).length) {
        return false;
      }
      return value !== oldValue;
    },
  })
  accessor widgets!: Record<WidgetName, TemplateResult>;
}
