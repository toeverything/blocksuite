import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { stopPropagation } from '../../../../../_common/utils/event.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';
import { builtInTemplates } from './builtin-templates.js';
import { ArrowIcon } from './icon.js';

@customElement('edgeless-templates-panel')
export class EdgelessTemplatePanel extends WithDisposable(LitElement) {
  static templates = builtInTemplates;
  static override styles = css`
    :host {
      position: absolute;
    }

    .edgeless-templates-panel {
      width: 467px;
      height: 568px;
      border-radius: 12px;
      background-color: #fff;
      box-shadow: 0px 10px 80px 0px rgba(0, 0, 0, 0.2);
    }

    .search-bar {
      padding: 21px 16px;
      font-size: 18px;
      color: var(--affine-secondary);
      border-bottom: 1px solid var(--affine-divider-color);
    }

    .search-input {
      border: 0;
      color: var(--affine-text-primary-color);
      outline: none;
      width: 100%;
    }

    .search-input::placeholder {
      color: var(--affine-text-secondary-color);
    }

    .template-categories {
      display: flex;
      flex-direction: column;
      padding: 6px 8px;
      border-bottom: 1px solid var(--affine-divider-color);
      gap: 4px;
      overflow-x: scroll;
    }

    .category-entry {
      color: var(--affine-text-secondary-color);
      font-size: 12px;
      font-weight: 600;
      line-height: 20px;
      border-radius: 32px;
      flex-shrink: 0;
      flex-grow: 0;
      width: fit-content;
      padding: 4px 9px;
    }

    .category-entry.selected,
    .category-entry:hover {
      color: var(--affine-text-primary-color);
      background-color: var(--affine-background-tertiary-color);
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
      width: 135px;
      height: 80px;
      box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.02);
      background-color: #fff;
      border-radius: 4px;
    }

    .template-item > svg {
      display: block;
      margin: 0 auto;
      transform: translateY(20%);
    }

    .arrow {
      bottom: 0;
      position: absolute;
      transform: translateY(20px);
    }
  `;

  @state()
  private _currentCategory = '';

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  override connectedCallback(): void {
    super.connectedCallback();

    this._currentCategory = EdgelessTemplatePanel.templates.categories()[0];
    this.addEventListener('keydown', stopPropagation, false);
  }

  override render() {
    const categories = EdgelessTemplatePanel.templates.categories();
    const templates = EdgelessTemplatePanel.templates.list(
      this._currentCategory
    );

    return html`
      <div class="edgeless-templates-panel">
        <div class="search-bar">
          <input
            class="search-input"
            type="text"
            placeholder="Search file or anything"
          />
        </div>
        <div class="template-categories">
          ${repeat(
            categories,
            cate => cate,
            cate => {
              return html`<div
                class="category-entry ${this._currentCategory === cate
                  ? 'selected'
                  : ''}"
              >
                ${cate}
              </div>`;
            }
          )}
        </div>
        <div class="template-list">
          ${repeat(
            templates,
            template => template.name,
            template => {
              return html`<div class="template-item">
                ${unsafeHTML(template.preview)}
              </div>`;
            }
          )}
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
