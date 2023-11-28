import './surface-ref-portal';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Disposable, noop } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type Y } from '@blocksuite/store';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EdgelessModeIcon,
  FrameIcon,
  MoreDeleteIcon,
} from '../_common/icons/index.js';
import {
  type CssVariableName,
  isCssVariable,
} from '../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../_common/theme/utils.js';
import { saveViewportToSession } from '../_common/utils/edgeless.js';
import { stopPropagation } from '../_common/utils/event.js';
import { buildPath, getEditorContainer } from '../_common/utils/query.js';
import type {
  EdgelessElement,
  TopLevelBlockModel,
} from '../_common/utils/types.js';
import type { NoteBlockModel, SurfaceBlockModel } from '../models.js';
import { ConnectorPathGenerator } from '../page-block/edgeless/connector-manager.js';
import { getBackgroundGrid } from '../page-block/edgeless/utils/query.js';
import { type CanvasElementType } from '../surface-block/elements/edgeless-element.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import { ConnectorElement, ElementCtors } from '../surface-block/index.js';
import {
  getGroupParent,
  setGroupParent,
} from '../surface-block/managers/group-manager.js';
import { LayerManager } from '../surface-block/managers/layer-manager.js';
import { Renderer } from '../surface-block/renderer.js';
import { Bound } from '../surface-block/utils/bound.js';
import { deserializeXYWH } from '../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from './surface-ref-model.js';
import { SurfaceRefPortal } from './surface-ref-portal.js';
import { getSurfaceBlock, noContentPlaceholder } from './utils.js';

noop(SurfaceRefPortal);

export const REF_LABEL_ICON = {
  'affine:frame': FrameIcon,
  DEFAULT_NOTE_HEIGHT: EdgelessModeIcon,
} as Record<string, TemplateResult>;

const NO_CONTENT_TITLE = {
  'affine:frame': 'Frame',
  group: 'Group',
  DEFAULT: 'Content',
} as Record<string, string>;

const NO_CONTENT_REASON = {
  group: 'This content was ungrouped or deleted on edgeless mode',
  DEFAULT: 'This content was deleted on edgeless mode',
} as Record<string, string>;

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

@customElement('affine-surface-ref')
export class SurfaceRefBlockComponent extends BlockElement<SurfaceRefBlockModel> {
  static override styles = css`
    .affine-surface-ref {
      position: relative;
      user-select: none;
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

    .surface-container {
      position: relative;
      padding: 20px;
      background-color: var(--affine-background-primary-color);
      background: radial-gradient(
        var(--affine-edgeless-grid-color) 1px,
        var(--affine-background-primary-color) 1px
      );
    }

    .surface-viewport {
      max-width: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      pointer-events: none;
      user-select: none;
    }

    .surface-viewport.frame {
      border-radius: 8px;
      border: 2px solid var(--affine-black-30);
    }

    .surface-canvas-container {
      height: 100%;
      width: 100%;
      position: relative;
    }

    .surface-ref-mask {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }

    .surface-ref-mask:hover {
      background-color: rgba(211, 211, 211, 0.1);
    }

    .surface-ref-mask:hover .ref-label {
      display: block;
    }

    .ref-label {
      display: none;
      user-select: none;
    }

    .ref-label {
      position: absolute;
      left: 0;
      bottom: 0;

      width: 100%;
      padding: 8px 16px;
      border: 1px solid #f1f1f1;
      gap: 14px;

      background: #fff;

      font-size: 12px;
    }

    .ref-label .title {
      display: inline-block;
      font-weight: 600;
      font-family: var(--affine-font-family);
      line-height: 20px;

      gap: 4px;

      color: var(--affine-text-secondary-color);
    }

    .ref-label .title > svg {
      color: var(--affine-icon-secondary);
      display: inline-block;
      vertical-align: baseline;
      width: 20px;
      height: 20px;
      vertical-align: bottom;
    }

    .ref-label .suffix {
      display: inline-block;
      font-weight: 400;
      color: var(--affine-text-disable-color);
      line-height: 20px;
    }

    .surface-ref-caption {
      margin-top: 10px;
      text-align: center;
    }

    .caption-input {
      border: 0;
      outline: none;
      width: 100%;
      display: block;
      text-align: center;

      font-size: var(--affine-font-sm);
      color: var(--affine-icon-color);
      background-color: transparent;
    }

    .caption-input::placeholder {
      color: var(--affine-placeholder-color);
    }
  `;
  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private _focused: boolean = false;

  @state()
  private _caption: string = '';

  @state()
  private _showCaption: boolean = false;

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

  get referenceModel() {
    return this._referencedModel;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this._shouldRender()) return;
    this._initHotkey();
    this._initSurfaceModel();
    this._initReferencedModel();
    this._initSelection();
    this._initSurfaceRenderer();
  }

  override updated() {
    this._attachRenderer();
  }

  private _attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  private _initHotkey() {
    const selection = this.root.selection;
    const addParagraph = () => {
      if (!this.page.getParent(this.model)) return;

      const [paragraphId] = this.page.addSiblingBlocks(this.model, [
        {
          flavour: 'affine:paragraph',
        },
      ]);
      const path = buildPath(this.page.getBlockById(paragraphId));

      requestAnimationFrame(() => {
        selection.update(selList => {
          return selList
            .filter(sel => !sel.is('block'))
            .concat(
              selection.getInstance('text', {
                from: {
                  path,
                  index: 0,
                  length: 0,
                },
                to: null,
              })
            );
        });
      });
    };

    this.bindHotKey({
      Enter: () => {
        if (!this._focused) return;
        addParagraph();
        return true;
      },
    });
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

      const referencedModel = this.getModel(this.model.reference);
      this._referencedModel =
        referencedModel && 'xywh' in referencedModel ? referencedModel : null;

      if (!referencedModel) return;

      if ('propsUpdated' in referencedModel) {
        refWathcer = referencedModel.propsUpdated.on(() => {
          if (referencedModel.flavour !== this.model.refFlavour) {
            this.page.updateBlock(this.model, {
              refFlavour: referencedModel.flavour,
            });
          }

          this.updateComplete.then(() => {
            this._refreshViewport();
          });
        });
      }

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
        this._caption = this.model.caption ?? '';
        if (this.model.reference !== this._referencedModel?.id) {
          init();
        }
      });
    });
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

  private _initSelection() {
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

      // update portal transform
      this.blocksPortal?.setViewport(this._surfaceRenderer);
    });
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

  private _deleteThis() {
    this.page.deleteBlock(this.model);
  }

  private _focusBlock() {
    this.selection.update(() => {
      return [this.selection.getInstance('block', { path: this.path })];
    });
  }

  private _renderMask(referencedModel: RefElement, flavourOrType: string) {
    const title = 'title' in referencedModel ? referencedModel.title : '';

    return html`
      <div class="surface-ref-mask">
        <div class="ref-label">
          <div class="title">
            ${REF_LABEL_ICON[flavourOrType ?? 'DEFAULT'] ??
            REF_LABEL_ICON.DEFAULT}
            <span>${title}</span>
          </div>
          <div class="suffix">from edgeless mode</div>
        </div>
      </div>
    `;
  }

  private _renderEmptyPlaceholder(model: SurfaceRefBlockModel) {
    return html`<div class="surface-empty-placeholder">
      <div class="placeholder-image">${noContentPlaceholder}</div>
      <div class="placeholder-text">
        No Such
        ${NO_CONTENT_TITLE[model.refFlavour ?? 'DEFAULT'] ??
        NO_CONTENT_TITLE.DEFAULT}
      </div>
      <div class="placeholder-action">
        <button class="delete-button" type="button" @click=${this._deleteThis}>
          <span class="icon">${MoreDeleteIcon}</span
          ><span>Delete this block</span>
        </button>
      </div>
      <div class="placeholder-reason">
        ${NO_CONTENT_REASON[model.refFlavour ?? 'DEFAULT'] ??
        NO_CONTENT_REASON.DEFAULT}
      </div>
    </div>`;
  }

  private _renderSurfaceContent(
    referencedModel: RefElement,
    renderer: Renderer
  ) {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);
    const { zoom } = renderer;
    const { gap } = getBackgroundGrid(zoom, true);
    const flavourOrType =
      'flavour' in referencedModel
        ? referencedModel.flavour
        : referencedModel.type;

    return html`<div
      class="surface-container"
      style=${styleMap({
        backgroundSize: `${gap}px ${gap}px`,
      })}
    >
      <div
        class="surface-viewport ${flavourOrType === 'affine:frame'
          ? 'frame'
          : ''}"
        style=${styleMap({
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
        })}
      >
        ${flavourOrType === 'affine:frame' || flavourOrType === 'group'
          ? html`<surface-ref-portal
              .page=${this.page}
              .root=${this.root}
              .containerModel=${referencedModel}
              .renderModel=${this.renderModel}
            ></surface-ref-portal>`
          : nothing}
        <div class="surface-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
      ${this._renderMask(referencedModel, flavourOrType)}
    </div>`;
  }

  private _updateCaption() {
    this.page.updateBlock(this.model, {
      caption: this._caption,
    });
  }

  private _onCaptionKeydown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.stopPropagation();

      this._updateCaption();
    }
  }

  private _onCaptionBlur() {
    this._updateCaption();

    if (!this._caption.length && this._showCaption) {
      this._showCaption = false;
    }
  }

  private _renderCaption() {
    if (!this._caption && !this._showCaption) return nothing;

    return html`<div class="surface-ref-caption">
      <input
        .value=${this._caption}
        .disabled=${this.model.page.readonly}
        placeholder="Write a caption"
        class="caption-input"
        @input=${(e: InputEvent) =>
          (this._caption = (e.target as HTMLInputElement).value)}
        @keydown=${this._onCaptionKeydown}
        @blur=${this._onCaptionBlur}
        @pointerdown=${stopPropagation}
        @click=${stopPropagation}
        @paste=${stopPropagation}
        @cut=${stopPropagation}
        @copy=${stopPropagation}
      />
    </div>`;
  }

  showCaption() {
    this._showCaption = true;

    this.updateComplete.then(() => {
      (
        this.renderRoot.querySelector('.caption-input') as HTMLInputElement
      )?.focus();
    });
  }

  viewInEdgeless() {
    if (!this._referencedModel) return;

    const editorContainer = getEditorContainer(this.page);

    if (editorContainer.mode !== 'edgeless') {
      editorContainer.mode = 'edgeless';
      saveViewportToSession(this.page.id, {
        referenceId: this.model.reference,
        padding: [60, 20, 20, 20],
      });
    }

    this.selection.update(selections => {
      return selections.filter(sel => !PathFinder.equals(sel.path, this.path));
    });
  }

  private _shouldRender() {
    return (
      !!this.root.querySelector('affine-doc-page') &&
      this.parentElement &&
      !this.parentElement.closest('affine-surface-ref')
    );
  }

  override render() {
    if (!this._shouldRender()) return nothing;

    const { _surfaceModel, _referencedModel, _surfaceRenderer, model } = this;
    const noContent =
      !_surfaceModel || !_referencedModel || !_referencedModel.xywh;

    return html`
      <div
        class="affine-surface-ref"
        @click=${this._focusBlock}
        style=${styleMap({
          outline: this._focused
            ? '2px solid var(--affine-primary-color)'
            : undefined,
        })}
      >
        ${noContent
          ? this._renderEmptyPlaceholder(model)
          : this._renderSurfaceContent(_referencedModel, _surfaceRenderer)}
        ${this._renderCaption()}
      </div>
      ${Object.values(this.widgets)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceRefBlockComponent;
  }
}
