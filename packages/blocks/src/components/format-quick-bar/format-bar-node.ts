import './button.js';

import {
  ArrowDownIcon,
  BlockConfig,
  CopyIcon,
  paragraphConfig,
} from '@blocksuite/global/config';
import {
  BaseBlockModel,
  DisposableGroup,
  Page,
  Signal,
} from '@blocksuite/store';
import type { TextAttributes } from '@blocksuite/virgo';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  getCurrentRange,
  getModelsByRange,
  getRichTextByModel,
} from '../../__internal__/utils/index.js';
import { formatConfig } from '../../page-block/utils/const.js';
import {
  DragDirection,
  getFormat,
  updateSelectedTextType,
} from '../../page-block/utils/index.js';
import { compareTopAndBottomSpace } from '../../page-block/utils/position.js';
import { toast } from '../toast.js';
import { formatQuickBarStyle } from './styles.js';

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  abortController = new AbortController();

  // Sometimes the quick bar need to update position
  @property()
  positionUpdated = new Signal();

  // for update position
  @property()
  direction!: DragDirection;

  @state()
  models: BaseBlockModel[] = [];

  @state()
  page: Page | null = null;

  @state()
  paragraphType: `${string}/${string}` = `${paragraphConfig[0].flavour}/${paragraphConfig[0].type}`;

  @state()
  paragraphPanelHoverDelay = 150;

  @state()
  paragraphPanelTimer = 0;

  @state()
  showParagraphPanel: 'top' | 'bottom' | 'hidden' = 'hidden';

  paragraphPanelMaxHeight: string | null = null;

  @state()
  format: TextAttributes = {};

  @query('.format-quick-bar')
  formatQuickBarElement!: HTMLElement;

  private _disposableGroup = new DisposableGroup();

  override connectedCallback(): void {
    super.connectedCallback();
    // TODO handle multiple selection
    const models = getModelsByRange(getCurrentRange());
    this.models = models;
    if (!models.length) {
      return;
    }
    const startModel = models[0];
    this.format = getFormat();
    this.paragraphType = `${startModel.flavour}/${startModel.type}`;
    this.page = startModel.page as Page;

    this.addEventListener('mousedown', (e: MouseEvent) => {
      // Prevent click event from making selection lost
      e.preventDefault();
    });
    this.abortController.signal.addEventListener('abort', () => {
      this.remove();
    });

    const mutationObserver = new MutationObserver(() => {
      this.format = getFormat();
    });
    models.forEach(model => {
      const richText = getRichTextByModel(model);
      if (!richText) {
        console.warn(
          'Format quick bar may not work properly! Cannot find rich text node by model. model:',
          model
        );
        return;
      }
      mutationObserver.observe(richText, {
        // One or more children have been added to and/or removed
        // from the tree.
        childList: true,
        // Omit (or set to false) to observe only changes to the parent node
        subtree: true,
      });
    });
    this._disposableGroup.add(() => {
      mutationObserver.disconnect();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._disposableGroup.dispose();
  }

  private _onHover() {
    if (this.showParagraphPanel !== 'hidden') {
      clearTimeout(this.paragraphPanelTimer);
      return;
    }

    this.paragraphPanelTimer = window.setTimeout(async () => {
      const { placement, height } = compareTopAndBottomSpace(
        this.formatQuickBarElement,
        document.body,
        10
      );
      this.showParagraphPanel = placement;
      this.paragraphPanelMaxHeight = height + 'px';
    }, this.paragraphPanelHoverDelay);
  }

  private _onHoverEnd() {
    if (this.showParagraphPanel !== 'hidden') {
      // Prepare to disappear
      this.paragraphPanelTimer = window.setTimeout(async () => {
        this.showParagraphPanel = 'hidden';
      }, this.paragraphPanelHoverDelay * 2);
      return;
    }
    clearTimeout(this.paragraphPanelTimer);
  }

  private _onCopy() {
    // Will forward to the `CopyCutManager`
    this.dispatchEvent(new ClipboardEvent('copy', { bubbles: true }));
    toast('Copied to clipboard');
  }

  private _paragraphPanelTemplate() {
    if (this.showParagraphPanel === 'hidden') {
      return html``;
    }
    const styles = styleMap({
      left: '0',
      top: this.showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: this.showParagraphPanel === 'top' ? 'calc(100% + 4px)' : null,
      maxHeight: this.paragraphPanelMaxHeight,
    });
    const updateParagraphType = (
      flavour: BlockConfig['flavour'],
      type?: string
    ) => {
      if (!this.page) {
        throw new Error('Failed to format paragraph! Page not found.');
      }
      if (this.paragraphType === `${flavour}/${type}`) {
        // Already in the target format, convert back to text
        const { flavour: defaultFlavour, type: defaultType } =
          paragraphConfig[0];
        if (this.paragraphType === defaultType) return;
        updateSelectedTextType(defaultFlavour, defaultType);
        this.paragraphType = `${defaultFlavour}/${defaultType}`;
        return;
      }
      updateSelectedTextType(flavour, type);
      this.paragraphType = `${flavour}/${type}`;
      this.positionUpdated.emit();
    };

    return html` <div
      class="paragraph-panel"
      style="${styles}"
      @mouseover=${this._onHover}
      @mouseout=${this._onHoverEnd}
    >
      ${paragraphConfig.map(
        ({ flavour, type, name, icon }) => html` <format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          data-testid="${flavour}/${type}"
          @click=${() => updateParagraphType(flavour, type)}
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const page = this.page;

    if (!this.models.length || !page) {
      console.error(
        'Failed to render format-quick-bar! page not found!',
        this.models,
        page
      );
      return html``;
    }
    const paragraphIcon =
      paragraphConfig.find(
        ({ flavour, type }) => `${flavour}/${type}` === this.paragraphType
      )?.icon ?? paragraphConfig[0].icon;
    const paragraphItems = html` <format-bar-button
      class="paragraph-button"
      width="52px"
      @mouseover=${this._onHover}
      @mouseout=${this._onHoverEnd}
    >
      ${paragraphIcon} ${ArrowDownIcon}
    </format-bar-button>`;

    const paragraphPanel = this._paragraphPanelTemplate();
    const formatItems = formatConfig
      .filter(({ showWhen = () => true }) => showWhen(this.models))
      .map(
        ({ id, name, icon, action, activeWhen }) => html` <format-bar-button
          class="has-tool-tip"
          data-testid=${id}
          ?active=${activeWhen(this.format)}
          @click=${() => {
            action({
              page,
              abortController: this.abortController,
              format: this.format,
            });
            this.positionUpdated.emit();
          }}
        >
          ${icon}
          <tool-tip inert role="tooltip">${name}</tool-tip>
        </format-bar-button>`
      );

    const actionItems = html` <format-bar-button
      class="has-tool-tip"
      data-testid="copy"
      @click=${() => this._onCopy()}
    >
      ${CopyIcon}
      <tool-tip inert role="tooltip">Copy</tool-tip>
    </format-bar-button>`;

    const styles = styleMap({
      left: this.left,
      top: this.top,
    });
    return html` <div class="format-quick-bar" style="${styles}">
      ${paragraphItems}
      <div class="divider"></div>
      ${formatItems}
      ${formatItems.length ? html` <div class="divider"></div>` : ''}
      ${actionItems} ${paragraphPanel}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
