import './template-loading.js';
import './overlay-scrollbar.js';

import { WithDisposable } from '@blocksuite/block-std';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import {
  requestConnectedFrame,
  stopPropagation,
} from '../../../../../_common/utils/event.js';
import { type IBound } from '../../../../../surface-block/consts.js';
import {
  Bound,
  getCommonBound,
} from '../../../../../surface-block/utils/bound.js';
import type { EdgelessRootBlockComponent } from '../../../edgeless-root-block.js';
import type { TemplateJob } from '../../../services/template.js';
import {
  createInsertPlaceMiddleware,
  createRegenerateIndexMiddleware,
  createStickerMiddleware,
  replaceIdMiddleware,
} from '../../../services/template-middlewares.js';
import { builtInTemplates } from './builtin-templates.js';
import { ArrowIcon, defaultPreview } from './icon.js';
import type { Template } from './template-type.js';
import { cloneDeep } from './utils.js';

@customElement('edgeless-templates-panel')
export class EdgelessTemplatePanel extends WithDisposable(LitElement) {
  static templates = builtInTemplates;
  static override styles = css`
    :host {
      position: absolute;
      font-family: var(--affine-font-family);
      z-index: 1;
    }

    .edgeless-templates-panel {
      width: 467px;
      height: 568px;
      border-radius: 12px;
      background-color: var(--affine-background-overlay-panel-color);
      box-shadow: 0px 10px 80px 0px rgba(0, 0, 0, 0.2);

      display: flex;
      flex-direction: column;
    }

    .search-bar {
      padding: 21px 24px;
      font-size: 18px;
      color: var(--affine-secondary);
      border-bottom: 1px solid var(--affine-divider-color);

      flex-shrink: 0;
    }

    .search-input {
      border: 0;
      color: var(--affine-text-primary-color);
      font-size: 20px;
      background-color: inherit;
      outline: none;
      width: 100%;
    }

    .search-input::placeholder {
      color: var(--affine-text-secondary-color);
    }

    .template-categories {
      display: flex;
      padding: 6px 8px;
      gap: 4px;
      overflow-x: scroll;

      flex-shrink: 0;
    }

    .category-entry {
      color: var(--affine-text-primary-color);
      font-size: 12px;
      font-weight: 600;
      line-height: 20px;
      border-radius: 8px;
      flex-shrink: 0;
      flex-grow: 0;
      width: fit-content;
      padding: 4px 9px;
      cursor: pointer;
    }

    .category-entry.selected,
    .category-entry:hover {
      color: var(--affine-text-primary-color);
      background-color: var(--affine-background-tertiary-color);
    }

    .template-viewport {
      position: relative;
      flex-grow: 1;
    }

    .template-scrollcontent {
      overflow: hidden;
      height: 100%;
      width: 100%;
    }

    .template-list {
      padding: 10px;
      display: flex;
      align-items: flex-start;
      align-content: flex-start;
      gap: 10px 20px;
      flex-wrap: wrap;
    }

    .template-item {
      position: relative;
      width: 135px;
      height: 80px;
      box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.02);
      background-color: var(--affine-background-primary-color);
      border-radius: 4px;
      cursor: pointer;
    }

    .template-item > svg {
      display: block;
      margin: 0 auto;
      width: 135px;
      height: 80px;
      color: var(--affine-background-primary-color);
    }

    .template-item:hover::before {
      content: attr(data-hover-text);
      position: absolute;
      display: block;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 110px;
      border-radius: 8px;
      padding: 4px 22px;
      box-sizing: border-box;
      z-index: 1;
      text-align: center;
      font-size: 12px;

      background-color: var(--affine-primary-color);
      color: var(--affine-white);
    }

    .template-item:hover::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border: 1px solid var(--affine-black-10);
      border-radius: 4px;
      background-color: var(--affine-hover-color);
    }

    .template-item.loading::before {
      display: none;
    }

    .template-item.loading > affine-template-loading {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .template-item img.template-preview {
      object-fit: contain;
      width: 100%;
      height: 100%;
      display: block;
    }

    .arrow {
      bottom: 0;
      position: absolute;
      transform: translateY(20px);
      color: var(--affine-background-overlay-panel-color);
    }
  `;

  @state()
  private _currentCategory = '';

  @state()
  private _loadingTemplate: Template | null = null;

  @state()
  private _searchKeyword = '';

  @state()
  private _loading = false;

  @state()
  private _categories: string[] = [];

  @state()
  private _templates: Template[] = [];

  private _fetchJob: null | { cancel: () => void } = null;

  @property({ attribute: false })
  edgeless!: EdgelessRootBlockComponent;

  override connectedCallback(): void {
    super.connectedCallback();

    this.addEventListener('keydown', stopPropagation, false);
    this._disposables.add(() => {
      if (this._currentCategory) {
        this.edgeless.service.editSession.setItem(
          'templateCache',
          this._currentCategory
        );
      }
    });
  }

  override firstUpdated() {
    requestConnectedFrame(() => {
      this._disposables.addFromEvent(document, 'click', evt => {
        if (this.contains(evt.target as HTMLElement)) {
          return;
        }

        this._closePanel();
      });
    }, this);
    this._disposables.addFromEvent(this, 'click', stopPropagation);
    this._disposables.addFromEvent(this, 'wheel', stopPropagation);

    this._initCategory().catch(() => {});
  }

  private async _initCategory() {
    try {
      this._categories = await EdgelessTemplatePanel.templates.categories();
      this._currentCategory =
        this._getLocalSelectedCategory() ?? this._categories[0];
      this._updateTemplates();
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  }

  private _fetch(fn: (state: { canceled: boolean }) => Promise<unknown>) {
    if (this._fetchJob) {
      this._fetchJob.cancel();
    }

    this._loading = true;

    const state = { canceled: false };
    const job = {
      cancel: () => {
        state.canceled = true;
      },
    };

    this._fetchJob = job;

    fn(state)
      .catch(() => {})
      .finally(() => {
        if (!state.canceled && job === this._fetchJob) {
          this._loading = false;
          this._fetchJob = null;
        }
      });
  }

  private _updateTemplates() {
    this._fetch(async state => {
      try {
        const templates = this._searchKeyword
          ? await EdgelessTemplatePanel.templates.search(this._searchKeyword)
          : await EdgelessTemplatePanel.templates.list(this._currentCategory);

        if (state.canceled) return;

        this._templates = templates;
      } catch (e) {
        if (state.canceled) return;

        console.error('Failed to load templates', e);
      }
    });
  }

  private _getLocalSelectedCategory() {
    return this.edgeless.service.editSession.getItem('templateCache');
  }

  private _createTemplateJob(type: string) {
    const middlewares: ((job: TemplateJob) => void)[] = [];
    const service = this.edgeless.service;

    if (type === 'template') {
      const currentContentBound = getCommonBound(
        (
          service.blocks.map(block => Bound.deserialize(block.xywh)) as IBound[]
        ).concat(service.elements)
      );

      if (currentContentBound) {
        currentContentBound.x +=
          currentContentBound.w + 20 / service.viewport.zoom;
        middlewares.push(createInsertPlaceMiddleware(currentContentBound));
      }

      const idxGenerator = service.layer.createIndexGenerator(true);

      middlewares.push(
        createRegenerateIndexMiddleware((type: string) => idxGenerator(type))
      );
    }

    if (type === 'sticker') {
      middlewares.push(
        createStickerMiddleware(service.viewport.center, () =>
          service.layer.generateIndex('affine:image')
        )
      );
    }

    middlewares.push(replaceIdMiddleware);

    return this.edgeless.service.TemplateJob.create({
      model: this.edgeless.surfaceBlockModel,
      type,
      middlewares,
    });
  }

  private async _insertTemplate(template: Template) {
    this._loadingTemplate = template;

    template = cloneDeep(template);

    const templateJob = this._createTemplateJob(template.type);
    const service = this.edgeless.service;

    try {
      const { assets } = template;

      if (assets) {
        await Promise.all(
          Object.entries(assets).map(([key, value]) =>
            fetch(value)
              .then(res => res.blob())
              .then(blob => templateJob.job.assets.set(key, blob))
          )
        );
      }

      const insertedBound = await templateJob.insertTemplate(template.content);

      if (insertedBound && template.type === 'template') {
        const padding = 20 / service.viewport.zoom;
        service.viewport.setViewportByBound(
          insertedBound,
          [padding, padding, padding, padding],
          true
        );
      }
    } finally {
      this._loadingTemplate = null;
      this._closePanel();
    }
  }

  private _closePanel() {
    this.dispatchEvent(new CustomEvent('closepanel'));
  }

  private _updateSearchKeyword(inputEvt: InputEvent) {
    this._searchKeyword = (inputEvt.target as HTMLInputElement).value;
    this._updateTemplates();
  }

  override render() {
    const { _categories, _currentCategory, _templates } = this;

    return html`
      <div class="edgeless-templates-panel">
        <div class="search-bar">
          <input
            class="search-input"
            type="text"
            placeholder="Search file or anything..."
            @input=${this._updateSearchKeyword}
          />
        </div>
        <div class="template-categories">
          ${repeat(
            _categories,
            cate => cate,
            cate => {
              return html`<div
                class="category-entry ${_currentCategory === cate
                  ? 'selected'
                  : ''}"
                @click=${() => {
                  this._currentCategory = cate;
                  this._updateTemplates();
                }}
              >
                ${cate}
              </div>`;
            }
          )}
        </div>
        <div class="template-viewport">
          <div class="template-scrollcontent" data-scrollable>
            <div class="template-list">
              ${this._loading
                ? html`<affine-template-loading
                    style=${styleMap({
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                    })}
                  ></affine-template-loading>`
                : repeat(
                    _templates,
                    template => template.name,
                    template => {
                      return html`
                        <div
                          class=${`template-item ${
                            template === this._loadingTemplate ? 'loading' : ''
                          }`}
                          data-hover-text="Add"
                          @click=${() => this._insertTemplate(template)}
                        >
                          ${template.preview
                            ? template.preview.startsWith('<svg')
                              ? html`${unsafeSVG(template.preview)}`
                              : html`<img
                                  src="${template.preview}"
                                  class="template-preview"
                                />`
                            : defaultPreview}
                          ${template === this._loadingTemplate
                            ? html`<affine-template-loading></affine-template-loading>`
                            : nothing}
                          ${template.name
                            ? html`<affine-tooltip
                                .offset=${12}
                                tip-position="top"
                              >
                                ${template.name}
                              </affine-tooltip>`
                            : nothing}
                        </div>
                      `;
                    }
                  )}
            </div>
          </div>
          <overlay-scrollbar></overlay-scrollbar>
        </div>
        <div class="arrow">${ArrowIcon}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-templates-panel': EdgelessTemplatePanel;
  }
}
