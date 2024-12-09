import type { AffineEditorContainer } from '@blocksuite/presets';
import type SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

import { ShadowlessElement } from '@blocksuite/block-std';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';
import {
  defaultImageProxyMiddleware,
  docLinkBaseURLMiddlewareBuilder,
  embedSyncedDocMiddleware,
  HtmlAdapter,
  MarkdownAdapter,
  PlainTextAdapter,
  titleMiddleware,
} from '@blocksuite/blocks';
import { WithDisposable } from '@blocksuite/global/utils';
import { type DocSnapshot, Job } from '@blocksuite/store';
import { effect } from '@preact/signals-core';
import { css, html, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

@customElement('adapters-panel')
export class AdaptersPanel extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    adapters-panel {
      width: 36vw;
    }
    .adapters-container {
      border: 1px solid var(--affine-border-color, #e3e2e4);
      background-color: var(--affine-background-primary-color);
      box-sizing: border-box;
      position: relative;
    }
    .adapter-container {
      padding: 0px 16px;
      width: 100%;
      height: calc(100vh - 80px);
      white-space: pre-wrap;
      color: var(--affine-text-primary-color);
      overflow: auto;
    }
    .update-button {
      position: absolute;
      top: 8px;
      right: 12px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--affine-border-color);
      font-family: var(--affine-font-family);
      color: var(--affine-text-primary-color);
      background-color: var(--affine-background-primary-color);
    }
    .update-button:hover {
      background-color: var(--affine-hover-color);
    }
    .html-panel {
      display: flex;
      gap: 8px;
      flex-direction: column;
    }
    .html-preview-container,
    .html-panel-content {
      width: 100%;
      flex: 1;
      border: none;
      box-sizing: border-box;
      color: var(--affine-text-primary-color);
      overflow: auto;
    }
    .html-panel-footer {
      width: 100%;
      height: 32px;
      display: flex;
      justify-content: flex-end;

      span {
        cursor: pointer;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid var(--affine-border-color);
        font-family: var(--affine-font-family);
        color: var(--affine-text-primary-color);
        background-color: var(--affine-background-primary-color);
        line-height: 20px;
      }
      span[active] {
        background-color: var(--affine-hover-color);
      }
    }
  `;

  get doc() {
    return this.editor.doc;
  }

  private _createJob() {
    return new Job({
      collection: this.doc.collection,
      middlewares: [
        docLinkBaseURLMiddlewareBuilder('https://example.com').get(),
        titleMiddleware,
        embedSyncedDocMiddleware('content'),
        defaultImageProxyMiddleware,
      ],
    });
  }

  private async _getDocSnapshot() {
    const job = this._createJob();
    const result = await job.docToSnapshot(this.doc);
    return result;
  }

  private async _getHtmlContent() {
    const job = this._createJob();
    const htmlAdapter = new HtmlAdapter(job);
    const result = await htmlAdapter.fromDoc(this.doc);
    return result?.file;
  }

  private async _getMarkdownContent() {
    const job = this._createJob();
    const markdownAdapter = new MarkdownAdapter(job);
    const result = await markdownAdapter.fromDoc(this.doc);
    return result?.file;
  }

  private async _getPlainTextContent() {
    const job = this._createJob();
    const plainTextAdapter = new PlainTextAdapter(job);
    const result = await plainTextAdapter.fromDoc(this.doc);
    return result?.file;
  }

  private async _handleTabShow(name: string) {
    switch (name) {
      case 'markdown':
        this._markdownContent = (await this._getMarkdownContent()) || '';
        break;
      case 'html':
        this._htmlContent = (await this._getHtmlContent()) || '';
        break;
      case 'plaintext':
        this._plainTextContent = (await this._getPlainTextContent()) || '';
        break;
      case 'snapshot':
        this._docSnapshot = (await this._getDocSnapshot()) || null;
        break;
    }
  }

  private _renderHtmlPanel() {
    return html`
      ${this._isHtmlPreview
        ? html`<iframe
            class="html-preview-container"
            .srcdoc=${this._htmlContent}
          ></iframe>`
        : html`<div class="html-panel-content">${this._htmlContent}</div>`}
      <div class="html-panel-footer">
        <span
          class="html-panel-footer-item"
          ?active=${!this._isHtmlPreview}
          @click=${() => (this._isHtmlPreview = false)}
          >Source</span
        >
        <span
          class="html-panel-footer-item"
          ?active=${this._isHtmlPreview}
          @click=${() => (this._isHtmlPreview = true)}
          >Preview</span
        >
      </div>
    `;
  }

  private async _updateActiveTabContent() {
    if (!this._activeTab) return;
    const activeTabName = this._activeTab.name;
    await this._handleTabShow(activeTabName);
  }

  override firstUpdated() {
    this.disposables.add(
      effect(() => {
        const doc = this.doc;
        if (doc) {
          this._updateActiveTabContent().catch(console.error);
        }
      })
    );
  }

  override render() {
    const snapshotString = this._docSnapshot
      ? JSON.stringify(this._docSnapshot, null, 4)
      : '';
    return html`
      <div class="adapters-container">
        <sl-tab-group
          activation="auto"
          @sl-tab-show=${(e: CustomEvent) => this._handleTabShow(e.detail.name)}
        >
          <sl-tab slot="nav" panel="markdown">Markdown</sl-tab>
          <sl-tab slot="nav" panel="plaintext">PlainText</sl-tab>
          <sl-tab slot="nav" panel="html">HTML</sl-tab>
          <sl-tab slot="nav" panel="snapshot">Snapshot</sl-tab>

          <sl-tab-panel name="markdown">
            <div class="adapter-container">${this._markdownContent}</div>
          </sl-tab-panel>
          <sl-tab-panel name="html">
            <div class="adapter-container html-panel">
              ${this._renderHtmlPanel()}
            </div>
          </sl-tab-panel>
          <sl-tab-panel name="plaintext">
            <div class="adapter-container">${this._plainTextContent}</div>
          </sl-tab-panel>
          <sl-tab-panel name="snapshot">
            <div class="adapter-container">${snapshotString}</div>
          </sl-tab-panel>
        </sl-tab-group>
        <sl-tooltip content="Update Adapter Content" placement="left" hoist>
          <div class="update-button" @click="${this._updateActiveTabContent}">
            Update
          </div>
        </sl-tooltip>
      </div>
    `;
  }

  override willUpdate(_changedProperties: PropertyValues) {
    if (_changedProperties.has('editor')) {
      requestIdleCallback(() => {
        this._updateActiveTabContent().catch(console.error);
      });
    }
  }

  @query('sl-tab-panel[active]')
  private accessor _activeTab!: SlTabPanel;

  @state()
  private accessor _docSnapshot: DocSnapshot | null = null;

  @state()
  private accessor _htmlContent = '';

  @state()
  private accessor _isHtmlPreview = false;

  @state()
  private accessor _markdownContent = '';

  @state()
  private accessor _plainTextContent = '';

  @property({ attribute: false })
  accessor editor!: AffineEditorContainer;
}

declare global {
  interface HTMLElementTagNameMap {
    'adapters-panel': AdaptersPanel;
  }
}
