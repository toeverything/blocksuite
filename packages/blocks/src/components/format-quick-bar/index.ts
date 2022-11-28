import { BaseBlockModel, Signal, Space } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  convertToList,
  getContainerByModel,
  getCurrentRange,
  getModelsByRange,
  sleep,
} from '../../__internal__/utils';
import { toast } from '../toast';
import './button';
import { formatButtons, paragraphButtons } from './config';
import { ArrowDownIcon, CopyIcon } from './icons';
import { formatQuickBarStyle } from './styles';

const isListType = (type: string): type is 'bulleted' | 'numbered' | 'todo' =>
  ['bulleted', 'numbered', 'todo'].includes(type);

const onCopy = (space: Space) => {
  document.dispatchEvent(new ClipboardEvent('copy'));
  toast('Copied to clipboard');
};

@customElement('format-quick-bar')
export class FormatQuickBar extends LitElement {
  static styles = formatQuickBarStyle;

  @property()
  left = '0px';

  @property()
  top = '0px';

  @property()
  abortController = new AbortController();

  // Sometimes the quick bar need to update position
  @property()
  positionUpdated = new Signal();

  @state()
  models: BaseBlockModel[] = [];

  @state()
  space: Space | null = null;

  @state()
  paragraphType = 'text';

  @property()
  paragraphPanelHoverDelay = 150;

  @state()
  paragraphPanelTimer = 0;

  @state()
  showParagraphPanel: 'top' | 'bottom' | 'hidden' = 'hidden';

  @query('.format-quick-bar')
  formatQuickBarElement!: HTMLElement;

  override connectedCallback(): void {
    super.connectedCallback();
    // TODO handle multiple selection
    const models = getModelsByRange(getCurrentRange());
    this.models = models;
    if (!models.length) {
      return;
    }
    const startModel = models[0];
    this.paragraphType = startModel.type;
    this.space = startModel.space;
    if (models.length > 1) {
      // Select multiple models
    }
  }

  private onHover() {
    if (this.showParagraphPanel !== 'hidden') {
      clearTimeout(this.paragraphPanelTimer);
      return;
    }
    this.paragraphPanelTimer = window.setTimeout(async () => {
      const rect = this.formatQuickBarElement.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const topSpace = rect.top - bodyRect.top;
      const bottomSpace = bodyRect.bottom - rect.bottom;
      this.showParagraphPanel = topSpace > bottomSpace ? 'top' : 'bottom';
    }, this.paragraphPanelHoverDelay);
  }

  private onHoverEnd() {
    if (this.showParagraphPanel !== 'hidden') {
      // Prepare to disappear
      this.paragraphPanelTimer = window.setTimeout(async () => {
        this.showParagraphPanel = 'hidden';
      }, this.paragraphPanelHoverDelay);
      return;
    }
    clearTimeout(this.paragraphPanelTimer);
  }

  private paragraphPanelTemplate() {
    if (this.showParagraphPanel === 'hidden') {
      return html``;
    }
    const formatParagraph = async (targetFormat: string) => {
      this.models
        .filter(i => i.type !== targetFormat)
        .forEach(model => {
          if (!this.space) {
            throw new Error('Space is not defined');
          }
          if (isListType(targetFormat)) {
            convertToList(this.space, model, targetFormat, '');
          } else {
            this.space.updateBlock(model, { type: targetFormat });
          }
          this.paragraphType = targetFormat;
        });
      // format quick bar may need to update its position
      // after the paragraph type is changed
      await sleep();
      this.positionUpdated.emit();
    };
    const styles = styleMap({
      left: '0',
      top: this.showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: this.showParagraphPanel === 'top' ? 'calc(100% + 4px)' : null,
      display: 'flex',
      flexDirection:
        this.showParagraphPanel === 'bottom' ? 'column' : 'column-reverse',
    });
    return html`<div
      class="paragraph-panel"
      style="${styles}"
      @mouseover=${this.onHover}
      @mouseout=${this.onHoverEnd}
    >
      ${paragraphButtons.map(
        ({ key, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          @click=${() => formatParagraph(key)}
        >
          ${icon}
        </format-bar-button>`
      )}
    </div>`;
  }

  override render() {
    const space = this.space;

    if (!this.models.length || !space) {
      console.error('Failed to render format-quick-bar! space not found!');
      return html``;
    }
    const paragraphIcon =
      paragraphButtons.find(btn => btn.key === this.paragraphType)?.icon ??
      paragraphButtons[0].icon;
    const paragraphItems = html`<format-bar-button
      class="paragraph-button"
      width="52px"
      @mouseover=${this.onHover}
      @mouseout=${this.onHoverEnd}
    >
      ${paragraphIcon} ${ArrowDownIcon}
    </format-bar-button>`;

    const paragraphPanel = this.paragraphPanelTemplate();

    const formatItems = html`
      ${formatButtons
        .filter(({ showWhen = () => true }) => showWhen(this.models))
        .map(
          ({ name, icon, action }) => html`<format-bar-button
            class="has-tool-tip"
            @click=${() => action(space, this.abortController)}
          >
            ${icon}
            <tool-tip inert role="tooltip">${name}</tool-tip>
          </format-bar-button>`
        )}
    `;

    const actionItems = html`<format-bar-button
      class="has-tool-tip"
      @click=${() => onCopy(space)}
    >
      ${CopyIcon}
      <tool-tip inert role="tooltip">Copy</tool-tip>
    </format-bar-button>`;

    return html`<div
        class="format-quick-bar"
        style="left: ${this.left}; top: ${this.top}"
      >
        ${paragraphItems}
        <div class="divider"></div>
        ${formatItems}
        <div class="divider"></div>
        ${actionItems} ${paragraphPanel}
    </div>`;
  }
}

export const showFormatQuickBar = async ({
  anchorEl,
  container = document.body,
  abortController = new AbortController(),
}: {
  anchorEl: {
    getBoundingClientRect: () => DOMRect;
    // contextElement?: Element;
  };
  container?: HTMLElement;
  abortController?: AbortController;
}) => {
  const formatQuickBar = document.createElement('format-quick-bar');
  formatQuickBar.abortController = abortController;
  const positionUpdatedSignal = new Signal();
  formatQuickBar.positionUpdated = positionUpdatedSignal;

  const models = getModelsByRange(getCurrentRange());
  if (!models.length) {
    return;
  }
  const editorContainer = getContainerByModel(models[0]);
  const scrollContainer = editorContainer.querySelector(
    '.affine-default-viewport'
  ) as HTMLDivElement;

  const updatePos = () => {
  const rect = anchorEl.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offset = rect.top - bodyRect.top + rect.height;
  const offsetY = 5;
  formatQuickBar.left = `${rect.left}px`;
  formatQuickBar.top = `${offset + offsetY}px`;
  };
  scrollContainer.addEventListener('scroll', updatePos, { passive: true });
  positionUpdatedSignal.on(updatePos);
  updatePos();
  container.appendChild(formatQuickBar);

  const clickAwayListener = (e: MouseEvent) => {
    if (e.target === formatQuickBar) {
      return;
    }
    abortController.abort();
    window.removeEventListener('mousedown', clickAwayListener);
  };
  window.addEventListener('mousedown', clickAwayListener);

  return new Promise<void>(res => {
    abortController.signal.addEventListener('abort', () => {
      // TODO add transition
      formatQuickBar.remove();
      scrollContainer.removeEventListener('scroll', updatePos);
      res();
    });
  });
};

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
