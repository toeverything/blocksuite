import './components/index.js';

import { WidgetElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { autoUpdate, computePosition } from '@floating-ui/dom';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import { buildPath } from '../../../_common/utils/query.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { PageRootBlockComponent } from '../../page/page-root-block.js';
import type { RootBlockModel } from '../../root-model.js';
import type {
  AIActionPanelAnswerConfig,
  AIActionPanelErrorConfig,
} from './components/index.js';

export interface AffineAIActionPanelWidgetConfig {
  answerRenderer: (answer: string) => TemplateResult<1>;
  generateAnswer: (props: {
    input: string;
    update: (answer: string) => void;
    finish: (type: 'success' | 'error') => void;
    // Used to allow users to stop actively when generating
    signal: AbortSignal;
  }) => void;

  finishStateConfig: AIActionPanelAnswerConfig;
  errorStateConfig: AIActionPanelErrorConfig;
}

export type AffineAIActionPanelState =
  | 'hidden'
  | 'input'
  | 'generating'
  | 'finished'
  | 'error';

export const AFFINE_AI_ACTION_PANEL_WIDGET = 'affine-ai-action-panel-widget';

@customElement(AFFINE_AI_ACTION_PANEL_WIDGET)
export class AffineAIActionPanelWidget extends WidgetElement<
  RootBlockModel,
  EdgelessRootBlockComponent | PageRootBlockComponent
> {
  static override styles = css`
    :host {
      display: flex;
      width: 100%;
      padding: 8px 12px;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;

      outline: none;
      border-radius: var(--8, 8px);
      border: 1px solid var(--light-detailColor-borderColor, #e3e2e4);
      background: var(--light-background-backgroundOverlayPanelColor, #fbfbfc);

      /* light/toolbarShadow */
      box-shadow: 0px 6px 16px 0px rgba(0, 0, 0, 0.14);

      gap: 8px;

      width: 630px;
      position: absolute;
      top: 0;
      left: 0;

      z-index: 1;
    }
    :host([data-hidden]) {
      display: none;
    }
  `;

  @property({ attribute: false })
  config: AffineAIActionPanelWidgetConfig | null = null;

  @property()
  state: AffineAIActionPanelState = 'hidden';

  get rootBlockElement() {
    return this.blockElement;
  }

  private _inputText: string | null = null;
  get inputText() {
    return this._inputText;
  }

  private _answer: string | null = null;
  get answer() {
    return this._answer;
  }

  private _abortController: AbortController | null = null;
  private _inputFinish = (text: string) => {
    assertExists(this.config);

    this._inputText = text;
    this.state = 'generating';

    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    this._answer = null;
    const update = (answer: string) => {
      this._answer = answer;
      this.requestUpdate();
    };
    const finish = (type: 'success' | 'error') => {
      if (type === 'error') {
        this.state = 'error';
      } else {
        this.state = 'finished';
      }

      this._abortController?.abort();
      this._abortController = null;
    };

    this.config.generateAnswer({
      input: text,
      update,
      finish,
      signal: this._abortController.signal,
    });
  };

  private _stopGenerating = () => {
    this._abortController?.abort();
    this.state = 'finished';
  };

  override connectedCallback() {
    super.connectedCallback();

    let cleanUp: () => void;
    this.handleEvent('keyDown', ctx => {
      const keyboardState = ctx.get('keyboardState');
      if (keyboardState.raw.key === ' ') {
        const selection = this.host.selection.find('text');
        if (
          selection &&
          selection.isCollapsed() &&
          selection.from.index === 0
        ) {
          const block = this.host.view.viewFromPath('block', selection.path);
          if (!block?.model?.text || block.model.text?.length > 0) return;

          keyboardState.raw.preventDefault();
          this.state = 'input';
          this.updateComplete
            .then(() => {
              cleanUp = autoUpdate(block, this, () => {
                computePosition(block, this, {
                  placement: 'bottom-start',
                })
                  .then(({ x, y }) => {
                    this.style.left = `${x}px`;
                    this.style.top = `${y}px`;
                  })
                  .catch(console.error);
              });
            })
            .catch(console.error);
        }
      }
    });

    this.disposables.add(
      this.rootBlockElement.slots.askAIButtonClicked.on(({ model }) => {
        const block = this.host.view.viewFromPath('block', buildPath(model));
        if (!block) return;
        console.log('block', block);
        this.state = 'input';
        this.updateComplete
          .then(() => {
            console.log('updateComplete: ', this);
            cleanUp = autoUpdate(block, this, () => {
              computePosition(block, this, {
                placement: 'bottom-start',
              })
                .then(({ x, y }) => {
                  this.style.left = `${x}px`;
                  this.style.top = `${y}px`;
                })
                .catch(console.error);
            });
          })
          .catch(console.error);
      })
    );

    this.tabIndex = -1;
    this.disposables.addFromEvent(this, 'blur', e => {
      console.log('blur', e);
      if (!e.relatedTarget || this.contains(e.relatedTarget as Node)) return;

      cleanUp?.();
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this._inputText = null;
      this._answer = null;
      this.state = 'hidden';
    });
  }

  override render() {
    if (this.state === 'hidden') {
      this.dataset.hidden = '';
      return nothing;
    } else {
      delete this.dataset.hidden;
    }

    if (!this.config) return nothing;
    const config = this.config;

    this.updateComplete
      .then(() => {
        this.focus();
      })
      .catch(console.error);
    return html`${choose(this.state, [
      [
        'input',
        () =>
          html`<ai-action-panel-input
            .onFinish=${this._inputFinish}
          ></ai-action-panel-input>`,
      ],
      [
        'generating',
        () => html`
          ${this.answer
            ? html`
                <ai-action-panel-answer
                  .finish=${false}
                  .config=${config.finishStateConfig}
                >
                  ${this.answer && config.answerRenderer(this.answer)}
                </ai-action-panel-answer>
              `
            : nothing}
          <ai-action-panel-generating
            .stopGenerating=${this._stopGenerating}
          ></ai-action-panel-generating>
        `,
      ],
      [
        'finished',
        () => html`
          <ai-action-panel-answer .config=${config.finishStateConfig}>
            ${this.answer && config.answerRenderer(this.answer)}
          </ai-action-panel-answer>
        `,
      ],
      [
        'error',
        () => html`
          <ai-action-panel-error
            .config=${config.errorStateConfig}
          ></ai-action-panel-error>
        `,
      ],
    ])}`;
  }
}
