import { assertExists, type Disposable } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type CssVariableName,
  isCssVariable,
} from '../../../../../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../../../../../_common/theme/utils.js';
import type {
  EdgelessElement,
  TopLevelBlockModel,
} from '../../../../../_common/utils/types.js';
import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { NoteBlockModel } from '../../../../../note-block/note-model.js';
import type { SurfaceElement } from '../../../../../surface-block/elements/surface-element.js';
import {
  Bound,
  type CanvasElementType,
  ConnectorElement,
  deserializeXYWH,
  ElementCtors,
} from '../../../../../surface-block/index.js';
import {
  getGroupParent,
  setGroupParent,
} from '../../../../../surface-block/managers/group-manager.js';
import { LayerManager } from '../../../../../surface-block/managers/layer-manager.js';
import { Renderer } from '../../../../../surface-block/renderer.js';
import type { SurfaceBlockModel } from '../../../../../surface-block/surface-model.js';
import type { SurfaceRefPortal } from '../../../../../surface-ref-block/surface-ref-portal.js';
import { getSurfaceBlock } from '../../../../../surface-ref-block/utils.js';
import { ConnectorPathGenerator } from '../../../connector-manager.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

const PREVIEW_CONTAINER_WIDTH = 268;
const PREVIEW_CONTAINER_HEIGHT = 150;

const styles = css`
  .frame-preview-container {
    display: block;
    width: var(100% - 16px);
    height: var(100% - 16px);
    position: relative;
  }

  .surface-container {
    position: relative;
    display: block;
    box-sizing: border-box;
    overflow: hidden;
  }

  .surface-viewport {
    max-width: 100%;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
  }

  .surface-canvas-container {
    height: 100%;
    width: 100%;
    position: relative;
  }
`;
export class FramePreview extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  private _referencedModel: RefElement | null = null;
  private _surfaceRenderer = new Renderer({
    layerManager: new LayerManager(),
  });
  private _connectorManager = new ConnectorPathGenerator({
    pickById: id => this.getModel(id),
    refresh: () => this._surfaceRenderer.refresh(),
  });
  private _elements = new Map<string, SurfaceElement>();

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  @query('surface-ref-portal')
  blocksPortal!: SurfaceRefPortal;

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get root() {
    return this.edgeless.root;
  }

  get page() {
    return this.edgeless.page;
  }

  private _attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  private _initSurfaceRenderer() {
    let lastWidth = 0;
    this.surfaceRenderer.layerManager.init([
      ...this._elements.values(),
      ...((this._surfaceModel?.children || []) as EdgelessElement[]),
      ...(this.page.getBlockByFlavour('affine:note') as EdgelessElement[]),
    ]);
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.width !== lastWidth) {
        lastWidth = entries[0].contentRect.width;
        this._refreshViewport();
      }
    });
    observer.observe(this);

    this._disposables.add(() => observer.disconnect());
  }

  private _initReferencedModel() {
    let refWathcer: Disposable | null = null;
    const init = () => {
      refWathcer?.dispose();

      const referencedModel = this.frame;
      this._referencedModel =
        referencedModel && 'xywh' in referencedModel ? referencedModel : null;

      if (!referencedModel) return;

      if ('propsUpdated' in referencedModel) {
        refWathcer = referencedModel.propsUpdated.on(() => {
          this.updateComplete.then(() => {
            this._refreshViewport();
          });
        });
      }

      this._refreshViewport();
    };

    init();

    this._disposables.add(() => {
      refWathcer?.dispose();
    });
  }

  private _initSurfaceModel() {
    const init = () => {
      this._surfaceModel = getSurfaceBlock(this.page);

      if (!this._surfaceModel) return;

      const elementsMap = this._surfaceModel.elements.getValue() as Y.Map<
        Y.Map<unknown>
      >;
      const onElementsChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
        this._onElementsChange(event, elementsMap);
      };
      elementsMap.observe(onElementsChange);
      this._disposables.add(() => elementsMap.unobserve(onElementsChange));

      this._syncFromExistingContainer(elementsMap);
    };

    init();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.page.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.page)
          ) {
            init();
          }
        })
      );
    }
  }

  private _onElementUpdatedOrAdded(id: string) {
    const element = this.getModel(id);

    if (
      element instanceof ConnectorElement &&
      this._connectorManager.hasRelatedElement(element)
    ) {
      this._connectorManager.updatePath(element);
    }
  }

  private _refreshViewport() {
    if (!this._referencedModel) {
      return;
    }

    const referencedModel = this._referencedModel;

    // trigger a rerender to update element's size
    // and set viewport after element's size has been updated
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._surfaceRenderer.onResize();
      this._surfaceRenderer.setViewportByBound(
        Bound.fromXYWH(deserializeXYWH(referencedModel.xywh))
      );

      this.blocksPortal?.setViewport(this._surfaceRenderer);
    });
  }

  private getModel(id: string): RefElement | null {
    return (
      (this.page.getBlockById(id) as Exclude<
        TopLevelBlockModel,
        NoteBlockModel
      >) ??
      this._elements.get(id) ??
      null
    );
  }

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      const yGroups: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as CanvasElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        if (type === 'group') {
          yGroups.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
      yGroups.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as CanvasElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: () => undefined,
      onElementUpdated: ({ id }) => {
        const element = this.getModel(id);

        if (
          element instanceof ConnectorElement &&
          !this._connectorManager.hasRelatedElement(element)
        ) {
          this._connectorManager.updatePath(element);
        }
      },
      updateElementLocalRecord: () => {},
      pickById: id => this.getModel(id),
      getGroupParent: getGroupParent,
      setGroupParent: setGroupParent,
    });
    element.computedValue = this._getCSSPropertyValue;
    element.mount(this._surfaceRenderer);
    this._elements.set(element.id, element);
    this._onElementUpdatedOrAdded(element.id);
  }

  private _onElementsChange = (
    event: Y.YMapEvent<Y.Map<unknown>>,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    const connectors: {
      change: (typeof event)['changes']['keys'] extends Map<string, infer V>
        ? V
        : never;
      id: string;
    }[] = [];
    event.keysChanged.forEach(id => {
      const change = event.changes.keys.get(id);
      if (!change) {
        console.error('invalid event', event);
        return;
      }

      if (
        change.action === 'add' &&
        elementsMap.get(id)?.get('type') === 'connector'
      ) {
        connectors.push({ change, id });
        return;
      } else {
        this._onYEvent(change, id, elementsMap);
      }
    });
    connectors.forEach(({ change, id }) =>
      this._onYEvent(change, id, elementsMap)
    );
  };

  private _onYEvent = (
    type: Y.YMapEvent<Y.Map<unknown>>['changes']['keys'] extends Map<
      string,
      infer V
    >
      ? V
      : never,
    id: string,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    if (type.action === 'add') {
      const yElement = elementsMap.get(id) as Y.Map<unknown>;
      const type = yElement.get('type') as CanvasElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        getLocalRecord: () => undefined,
        updateElementLocalRecord: () => {},
        pickById: id => this.getModel(id),
        getGroupParent: getGroupParent,
        setGroupParent: setGroupParent,
      });
      element.computedValue = this._getCSSPropertyValue;
      element.mount(this._surfaceRenderer);
      this._elements.set(element.id, element);
      this._onElementUpdatedOrAdded(element.id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);

      if (element) {
        element.unmount();
        this._elements.delete(id);
      }
    }

    this._surfaceRenderer.refresh();
    this.requestUpdate();
  };

  private _getCSSPropertyValue = (value: string) => {
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(
        this.root,
        value as CssVariableName
      );
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private _getSurfaceWH(referencedModel: RefElement) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);

    const scale = Math.min(
      PREVIEW_CONTAINER_WIDTH / w,
      PREVIEW_CONTAINER_HEIGHT / h
    );

    return {
      width: w * scale,
      height: h * scale,
    };
  }

  private _renderSurfaceContent(referencedModel: RefElement) {
    const { width, height } = this._getSurfaceWH(referencedModel);
    return html`<div
      class="surface-container"
      style=${styleMap({
        width: `${PREVIEW_CONTAINER_WIDTH}px`,
        height: `${PREVIEW_CONTAINER_HEIGHT}px`,
      })}
    >
      <div
        class="surface-viewport"
        style=${styleMap({
          width: `${width}px`,
          height: `${height}px`,
          aspectRatio: `${width} / ${height}`,
        })}
      >
        <surface-ref-portal
          .page=${this.page}
          .root=${this.root}
          .containerModel=${referencedModel}
          .renderModel=${this.root.renderModel}
        ></surface-ref-portal>
        <div class="surface-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._initSurfaceModel();
    this._initReferencedModel();
    this._initSurfaceRenderer();
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this.requestUpdate();
    }
    this._attachRenderer();
  }

  override render() {
    console.log('render frame preview');
    const { _surfaceModel, _referencedModel } = this;
    const noContent =
      !_surfaceModel || !_referencedModel || !_referencedModel.xywh;

    console.log('render frame preview');
    return html`<div class="frame-preview-container">
      ${noContent ? nothing : this._renderSurfaceContent(_referencedModel)}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-preview': FramePreview;
  }
}
