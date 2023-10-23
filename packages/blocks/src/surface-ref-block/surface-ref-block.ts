import './portal/note.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Disposable } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type Y } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type CssVariableName,
  isCssVariable,
} from '../__internal__/theme/css-variables.js';
import { getThemePropertyValue } from '../__internal__/theme/utils.js';
import { type AbstractEditor } from '../__internal__/utils/types.js';
import { MoreDeleteIcon } from '../icons/edgeless.js';
import type { FrameBlockModel, SurfaceBlockModel } from '../models.js';
import { getNotesInFrame } from '../page-block/edgeless/frame-manager.js';
import { getBackgroundGrid } from '../page-block/edgeless/utils/query.js';
import { type PhasorElementType } from '../surface-block/elements/edgeless-element.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import { ElementCtors } from '../surface-block/index.js';
import { Renderer } from '../surface-block/renderer.js';
import { Bound } from '../surface-block/utils/bound.js';
import { deserializeXYWH } from '../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from './surface-ref-model.js';
import { getSurfaceBlock, noContentPlaceholder } from './utils.js';

const NO_CONTENT_TITLE = {
  'affine:frame': 'Frame',
  'affine:group': 'Note',
  DEFAULT: 'Content',
} as Record<string, string>;

const NO_CONTENT_REASON = {
  'affine:group': 'This content was ungrouped or deleted on edgeless mode',
  DEFAULT: 'This content was deleted on edgeless mode',
} as Record<string, string>;

@customElement('affine-surface-ref')
export class SurfaceSyncBlockComponent extends BlockElement<SurfaceRefBlockModel> {
  static override styles = css`
    .affine-surface-ref {
      padding: 10px;
      position: relative;
    }

    .surface-empty-placeholder {
      padding: 26px 0px 0px;
    }

    .placeholder-image {
      margin: 0 auto;
      text-align: center;
    }

    .placeholder-text {
      margin: 12px auto 0;
      text-align: center;
      font-size: 28px;
      font-weight: 600;
      line-height: 36px;
      font-family: var(--affine-font-family);
    }

    .placeholder-action {
      margin: 32px auto 0;
      text-align: center;
    }

    .delete-button {
      width: 204px;
      padding: 4px 18px;

      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 4px;

      border-radius: 8px;
      border: 1px solid var(--affine-border-color);

      font-family: var(--affine-font-family);
      font-size: 12px;
      font-weight: 500;
      line-height: 20px;

      background-color: transparent;
      cursor: pointer;
    }

    .delete-button > .icon > svg {
      color: var(--affine-icon-color);
      width: 16px;
      height: 16px;
      display: block;
    }

    .placeholder-reason {
      margin: 72px auto 0;
      padding: 10px;

      text-align: center;
      font-size: 12px;
      font-family: var(--affine-font-family);
      line-height: 20px;

      color: var(--affine-warning-color);
      background-color: var(--affine-background-error-color);
    }

    .surface-viewport {
      max-width: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      background-color: var(--affine-background-primary-color);
      background-image: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .surface-block-portal {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
    }

    .surface-canvas-container {
      height: 100%;
      width: 100%;
      position: relative;
    }
  `;
  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private _focused: boolean = false;

  private _referenceModel: FrameBlockModel | null = null;
  private _surfaceRenderer = new Renderer();
  private _elements = new Map<string, SurfaceElement>();

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  @query('.surface-block-portal')
  blocksPortal!: HTMLDivElement;

  override connectedCallback() {
    super.connectedCallback();
    this.initSurfaceModel();
    this.initReferenceModel();
    this.initSelection();
    this.initSurfaceRenderer();
  }

  override updated() {
    this.attachRenderer();
  }

  attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  initSurfaceRenderer() {
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.width !== lastWidth) {
        lastWidth = entries[0].contentRect.width;
        this._refreshViewport();
      }
    });
    observer.observe(this);

    this._disposables.add(() => observer.disconnect());
  }

  initReferenceModel() {
    let referenceWathcer: Disposable | null = null;
    const init = () => {
      referenceWathcer?.dispose();

      const referenceModel = this.getModel(
        this.model.reference
      ) as FrameBlockModel;
      this._referenceModel =
        referenceModel && 'xywh' in referenceModel ? referenceModel : null;

      if (!this._referenceModel) return;

      referenceWathcer = referenceModel.propsUpdated.on(() => {
        if (referenceModel.flavour !== this.model.refFlavour) {
          this.page.updateBlock(this.model, {
            refFlavour: referenceModel.flavour,
          });
        }

        this.updateComplete.then(() => {
          this._refreshViewport();
        });
      });

      this._refreshViewport();
    };

    init();

    this._disposables.add(() => {
      this.page.slots.blockUpdated.on(({ type, id }) => {
        if (type === 'delete' && id === this.model.reference) {
          init();
        }
      });
    });
    this._disposables.add(() => {
      this.model.propsUpdated.on(() => {
        if (this.model.reference !== this._referenceModel?.id) {
          init();
        }
      });
    });
    this._disposables.add(() => {
      referenceWathcer?.dispose();
    });
  }

  initSurfaceModel() {
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

  initSelection() {
    const selection = this.root.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._focused = selList.some(
          sel => PathFinder.equals(sel.path, this.path) && sel.is('block')
        );
      })
    );
  }

  private _refreshViewport() {
    if (!this._referenceModel) {
      return;
    }

    const referenceModel = this._referenceModel;

    // trigger an rerender to update element's size
    // and set viewport after element's size has been updated
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._surfaceRenderer.onResize();
      this._surfaceRenderer.setViewportByBound(
        Bound.fromXYWH(deserializeXYWH(referenceModel.xywh))
      );

      // trigger an rerender to update portal transform
      this.requestUpdate();
    });
  }

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as PhasorElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as PhasorElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: () => undefined,
      onElementUpdated: () => {},
    });
    element.computedValue = this._getCSSPropertyValue;
    element.mount(this._surfaceRenderer);
    this._elements.set(element.id, element);
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
      const type = yElement.get('type') as PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        getLocalRecord: () => undefined,
      });
      element.computedValue = this._getCSSPropertyValue;
      element.mount(this._surfaceRenderer);
      this._elements.set(element.id, element);
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
    const root = this.root;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(root, value as CssVariableName);
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

  private getModel(id: string) {
    return this.page.getBlockById(id) ?? this._elements.get(id) ?? null;
  }

  deleteThis() {
    this.page.deleteBlock(this.model);
  }

  viewInEdgeless() {
    if (!this._referenceModel) return;

    const xywh = deserializeXYWH(this._referenceModel.xywh);
    const doc = this.ownerDocument;
    const editorContainer = doc.querySelector(
      'editor-container'
    ) as AbstractEditor;

    if (!editorContainer) return;

    if (editorContainer.mode !== 'edgeless') {
      editorContainer.mode = 'edgeless';
    }

    setTimeout(() => {
      const edgeless = doc.querySelector('affine-edgeless-page');

      edgeless?.surface.viewport.setViewportByBound(
        Bound.fromXYWH(xywh),
        [100, 60, 100, 60],
        false
      );
    }, 50);

    this.selection.update(selections => {
      return selections.filter(sel => !PathFinder.equals(sel.path, this.path));
    });
  }

  focusBlock() {
    this.selection.update(() => {
      return [this.selection.getInstance('block', { path: this.path })];
    });
  }

  private _renderTopLevelBlocks() {
    const notes = getNotesInFrame(
      this.page,
      this._referenceModel as FrameBlockModel,
      false
    );

    return repeat(
      notes,
      model => model.id,
      (model, index) => {
        return html`<surface-ref-note-portal
          .index=${index}
          .model=${model}
          .renderModel=${this.renderModel}
        ></surface-ref-note-portal>`;
      }
    );
  }

  private _renderEmptyPlaceholder(model: SurfaceRefBlockModel) {
    return html`<div class="surface-empty-placeholder">
      <div class="placeholder-image">${noContentPlaceholder}</div>
      <div class="placeholder-text">
        No Such ${NO_CONTENT_TITLE[model.refFlavour ?? 'DEFAULT']}
      </div>
      <div class="placeholder-action">
        <button class="delete-button" type="button" @click=${this.deleteThis}>
          <span class="icon">${MoreDeleteIcon}</span
          ><span>Delete this block</span>
        </button>
      </div>
      <div class="placeholder-reason">
        ${NO_CONTENT_REASON[model.refFlavour ?? 'DEFAULT']}
      </div>
    </div>`;
  }

  private _renderSurfaceContent(
    referenceModel: FrameBlockModel,
    renderer: Renderer
  ) {
    const [, , w, h] = deserializeXYWH(referenceModel.xywh);
    const { zoom, translateX, translateY } = renderer;
    const { gap } = getBackgroundGrid(zoom, true);

    return html` <div
      class="surface-viewport"
      style=${styleMap({
        width: `${w}px`,
        aspectRatio: `${w} / ${h}`,
        outline: this._focused
          ? '2px solid var(--affine-primary-color)'
          : undefined,
        backgroundSize: `${gap}px ${gap}px`,
      })}
    >
      ${this._referenceModel?.flavour === 'affine:frame'
        ? html`<div
            class="surface-block-portal"
            style=${styleMap({
              transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
            })}
          >
            ${this._renderTopLevelBlocks()}
          </div>`
        : nothing}
      <div
        class="surface-canvas-container"
        @dblclick=${this.viewInEdgeless}
        @click=${this.focusBlock}
      >
        <!-- attach canvas here -->
      </div>
    </div>`;
  }

  override render() {
    const { _surfaceModel, _referenceModel, _surfaceRenderer, model } = this;
    const noContent =
      !_surfaceModel || !_referenceModel || !_referenceModel.xywh;

    return html`<div class="affine-surface-ref">
      ${noContent
        ? this._renderEmptyPlaceholder(model)
        : this._renderSurfaceContent(_referenceModel, _surfaceRenderer)}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceSyncBlockComponent;
  }
}
